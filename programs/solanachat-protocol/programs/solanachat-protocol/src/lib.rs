use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    declare_id, entrypoint,
    entrypoint::ProgramResult,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    sysvar::{clock::Clock, rent::Rent, Sysvar},
};

declare_id!("4Eh646fwA4q1G6xAtSXUYTzrAvHRZJ5MsZvmBmLBWuUK");

// ─── Accounts ───

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct DcaVault {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub amount_per_interval: u64,
    pub interval_seconds: i64,
    pub next_execution: i64,
    pub recipient: Pubkey,
    pub total_deposited: u64,
    pub total_executed: u64,
    pub bump: u8,
}

impl DcaVault {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 32 + 8 + 8 + 1;
}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Timelock {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub recipient: Pubkey,
    pub release_time: i64,
    pub claimed: bool,
    pub bump: u8,
}

impl Timelock {
    pub const LEN: usize = 32 + 32 + 8 + 32 + 8 + 1 + 1;
}

// ─── Instructions ───

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum ProtocolInstruction {
    InitVault { amount_per_interval: u64, interval_seconds: i64 },
    DepositToVault { amount: u64 },
    ExecuteDca,
    CloseVault,
    InitTimelock { amount: u64, release_time: i64 },
    ClaimTimelock,
}

// ─── Errors ───

#[derive(Debug)]
pub enum ProtocolError {
    NotRentExempt,
    InsufficientBalance,
    VaultNotDue,
    TimelockNotReleased,
    AlreadyClaimed,
    InvalidOwner,
    Overflow,
}

impl From<ProtocolError> for ProgramError {
    fn from(e: ProtocolError) -> Self {
        ProgramError::Custom(match e {
            ProtocolError::NotRentExempt => 6000,
            ProtocolError::InsufficientBalance => 6001,
            ProtocolError::VaultNotDue => 6002,
            ProtocolError::TimelockNotReleased => 6003,
            ProtocolError::AlreadyClaimed => 6004,
            ProtocolError::InvalidOwner => 6005,
            ProtocolError::Overflow => 6006,
        })
    }
}

// ─── Entrypoint ───

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = ProtocolInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        ProtocolInstruction::InitVault { amount_per_interval, interval_seconds } => {
            process_init_vault(program_id, accounts, amount_per_interval, interval_seconds)
        }
        ProtocolInstruction::DepositToVault { amount } => {
            process_deposit_to_vault(program_id, accounts, amount)
        }
        ProtocolInstruction::ExecuteDca => process_execute_dca(program_id, accounts),
        ProtocolInstruction::CloseVault => process_close_vault(program_id, accounts),
        ProtocolInstruction::InitTimelock { amount, release_time } => {
            process_init_timelock(program_id, accounts, amount, release_time)
        }
        ProtocolInstruction::ClaimTimelock => process_claim_timelock(program_id, accounts),
    }
}

// ─── Helpers ───

fn transfer_signed<'a>(
    token_program: &AccountInfo<'a>,
    source: &AccountInfo<'a>,
    destination: &AccountInfo<'a>,
    authority: &AccountInfo<'a>,
    amount: u64,
    seeds: &[&[u8]],
    _bump: u8,
) -> ProgramResult {
    let ix = spl_token::instruction::transfer(
        token_program.key,
        source.key,
        destination.key,
        authority.key,
        &[],
        amount,
    )?;

    invoke_signed(
        &ix,
        &[source.clone(), destination.clone(), authority.clone(), token_program.clone()],
        &[seeds],
    )
}

// ─── Init Vault ───

fn process_init_vault(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount_per_interval: u64,
    interval_seconds: i64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let vault = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let _token_mint = next_account_info(account_info_iter)?;
    let _owner_ata = next_account_info(account_info_iter)?;
    let _vault_ata = next_account_info(account_info_iter)?;
    let recipient = next_account_info(account_info_iter)?;
    let _token_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (expected_key, bump) = Pubkey::find_program_address(
        &[
            b"dca-vault",
            owner.key.as_ref(),
            recipient.key.as_ref(),
        ],
        program_id,
    );
    if vault.key != &expected_key {
        return Err(ProgramError::InvalidSeeds);
    }

    let rent = Rent::from_account_info(rent_info)?;
    let lamports = rent.minimum_balance(DcaVault::LEN);

    let signer_seeds: &[&[u8]] = &[
        b"dca-vault",
        owner.key.as_ref(),
        recipient.key.as_ref(),
        &[bump],
    ];

    let create_ix = solana_program::system_instruction::create_account(
        owner.key,
        vault.key,
        lamports,
        DcaVault::LEN as u64,
        program_id,
    );
    invoke_signed(
        &create_ix,
        &[owner.clone(), vault.clone(), system_program.clone()],
        &[signer_seeds],
    )?;

    let vault_data = DcaVault {
        owner: *owner.key,
        token_mint: *owner.key,
        amount_per_interval,
        interval_seconds,
        next_execution: 0, // immediately executable on first run
        recipient: *recipient.key,
        total_deposited: 0,
        total_executed: 0,
        bump,
    };
    vault_data.serialize(&mut *vault.data.borrow_mut())?;

    Ok(())
}

// ─── Deposit ───

fn process_deposit_to_vault(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let vault = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let owner_ata = next_account_info(account_info_iter)?;
    let vault_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut vault_data: DcaVault =
        BorshDeserialize::try_from_slice(&vault.data.borrow())?;

    vault_data.total_deposited = vault_data
        .total_deposited
        .checked_add(amount)
        .ok_or(ProtocolError::Overflow)?;
    vault_data.serialize(&mut *vault.data.borrow_mut())?;

    let ix = spl_token::instruction::transfer(
        token_program.key,
        owner_ata.key,
        vault_ata.key,
        owner.key,
        &[],
        amount,
    )?;
    invoke(
        &ix,
        &[owner_ata.clone(), vault_ata.clone(), owner.clone(), token_program.clone()],
    )
}

// ─── Execute DCA ───

fn process_execute_dca(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let vault = next_account_info(account_info_iter)?;
    let vault_ata = next_account_info(account_info_iter)?;
    let recipient_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    let vault_data: DcaVault =
        BorshDeserialize::try_from_slice(&vault.data.borrow())?;

    let now = Clock::get()?.unix_timestamp;
    if now < vault_data.next_execution {
        return Err(ProtocolError::VaultNotDue.into());
    }

    let amount = vault_data.amount_per_interval;

    let signer_seeds: &[&[u8]] = &[
        b"dca-vault",
        vault_data.owner.as_ref(),
        vault_data.recipient.as_ref(),
        &[vault_data.bump],
    ];

    // CPI transfer before vault data mutation
    transfer_signed(
        token_program,
        vault_ata,
        recipient_ata,
        vault,
        amount,
        signer_seeds,
        vault_data.bump,
    )?;

    // Now mutate vault data (after CPI)
    let mut vault_data = vault_data;
    vault_data.total_executed = vault_data
        .total_executed
        .checked_add(amount)
        .ok_or(ProtocolError::Overflow)?;
    vault_data.next_execution = vault_data
        .next_execution
        .checked_add(vault_data.interval_seconds)
        .ok_or(ProtocolError::Overflow)?;
    vault_data.serialize(&mut *vault.data.borrow_mut())?;

    Ok(())
}

// ─── Close Vault ───

fn process_close_vault(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let vault = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let vault_ata = next_account_info(account_info_iter)?;
    let owner_ata = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let vault_data: DcaVault =
        BorshDeserialize::try_from_slice(&vault.data.borrow())?;

    if vault_data.owner != *owner.key {
        return Err(ProtocolError::InvalidOwner.into());
    }

    let balance = spl_token::state::Account::unpack(&vault_ata.data.borrow())?.amount;

    let signer_seeds: &[&[u8]] = &[
        b"dca-vault",
        vault_data.owner.as_ref(),
        vault_data.recipient.as_ref(),
        &[vault_data.bump],
    ];

    transfer_signed(
        token_program,
        vault_ata,
        owner_ata,
        vault,
        balance,
        signer_seeds,
        vault_data.bump,
    )?;

    let vault_lamports = vault.lamports();
    **vault.lamports.borrow_mut() = 0;
    **owner.lamports.borrow_mut() = owner
        .lamports()
        .checked_add(vault_lamports)
        .ok_or(ProtocolError::Overflow)?;

    let data = &mut vault.data.borrow_mut();
    for byte in data.iter_mut() {
        *byte = 0;
    }

    Ok(())
}

// ─── Init Timelock ───

fn process_init_timelock(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    release_time: i64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let timelock = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let _token_mint = next_account_info(account_info_iter)?;
    let owner_ata = next_account_info(account_info_iter)?;
    let escrow_ata = next_account_info(account_info_iter)?;
    let recipient = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (expected_key, bump) = Pubkey::find_program_address(
        &[
            b"timelock",
            owner.key.as_ref(),
            recipient.key.as_ref(),
        ],
        program_id,
    );
    if timelock.key != &expected_key {
        return Err(ProgramError::InvalidSeeds);
    }

    let rent = Rent::from_account_info(rent_info)?;
    let lamports = rent.minimum_balance(Timelock::LEN);

    let signer_seeds: &[&[u8]] = &[
        b"timelock",
        owner.key.as_ref(),
        recipient.key.as_ref(),
        &[bump],
    ];

    let create_ix = solana_program::system_instruction::create_account(
        owner.key,
        timelock.key,
        lamports,
        Timelock::LEN as u64,
        program_id,
    );
    invoke_signed(
        &create_ix,
        &[owner.clone(), timelock.clone(), system_program.clone()],
        &[signer_seeds],
    )?;

    let t = Timelock {
        owner: *owner.key,
        token_mint: *owner.key,
        amount,
        recipient: *recipient.key,
        release_time,
        claimed: false,
        bump,
    };
    t.serialize(&mut *timelock.data.borrow_mut())?;

    let ix = spl_token::instruction::transfer(
        token_program.key,
        owner_ata.key,
        escrow_ata.key,
        owner.key,
        &[],
        amount,
    )?;
    invoke(
        &ix,
        &[owner_ata.clone(), escrow_ata.clone(), owner.clone(), token_program.clone()],
    )
}

// ─── Claim Timelock ───

fn process_claim_timelock(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let timelock = next_account_info(account_info_iter)?;
    let escrow_ata = next_account_info(account_info_iter)?;
    let recipient_ata = next_account_info(account_info_iter)?;
    let _recipient = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    let t: Timelock = BorshDeserialize::try_from_slice(&timelock.data.borrow())?;

    if t.claimed {
        return Err(ProtocolError::AlreadyClaimed.into());
    }

    let now = Clock::get()?.unix_timestamp;
    if now < t.release_time {
        return Err(ProtocolError::TimelockNotReleased.into());
    }

    let signer_seeds: &[&[u8]] = &[
        b"timelock",
        t.owner.as_ref(),
        t.recipient.as_ref(),
        &[t.bump],
    ];

    // CPI transfer before data mutation
    transfer_signed(
        token_program,
        escrow_ata,
        recipient_ata,
        timelock,
        t.amount,
        signer_seeds,
        t.bump,
    )?;

    // Now mutate timelock data
    let mut t = t;
    t.claimed = true;
    t.serialize(&mut *timelock.data.borrow_mut())?;

    Ok(())
}
