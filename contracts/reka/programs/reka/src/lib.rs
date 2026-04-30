use anchor_lang::prelude::*;

declare_id!("3CLJYRpGhR5ZKmaC3Asvtww7BECvbFsa5L81454NZWjX");

const MAX_ID_LEN: usize = 32;
const MAX_CATEGORY_LEN: usize = 16;
const MAX_BRAND_LEN: usize = 32;
const MAX_MODEL_LEN: usize = 64;
const MAX_SERIAL_HASH_LEN: usize = 32;
const MAX_CONDITION_LEN: usize = 24;
const MAX_BATTERY_LEN: usize = 16;
const MAX_VALUE_LEN: usize = 24;
const MAX_CITY_LEN: usize = 32;
const MAX_NAME_LEN: usize = 48;
const MAX_VERIFIER_LEN: usize = 48;
const MAX_TITLE_LEN: usize = 72;
const MAX_NOTES_LEN: usize = 280;

#[program]
pub mod reka {
    use super::*;

    pub fn create_passport(
        ctx: Context<CreatePassport>,
        input: CreatePassportInput,
    ) -> Result<()> {
        validate_create_passport_input(&input)?;

        let now = Clock::get()?.unix_timestamp;
        let passport = &mut ctx.accounts.passport;

        passport.authority = ctx.accounts.payer.key();
        passport.owner = input.owner;
        passport.owner_name = input.owner_name;
        passport.category = input.category;
        passport.brand = input.brand;
        passport.model = input.model;
        passport.serial_hash = input.serial_hash;
        passport.condition = input.condition;
        passport.battery_health = input.battery_health;
        passport.estimated_value = input.estimated_value;
        passport.city = input.city;
        passport.verifier_name = input.verifier_name;
        passport.trust_score = 78;
        passport.history_count = 0;
        passport.transfer_count = 0;
        passport.created_at = now;
        passport.updated_at = now;
        passport.bump = ctx.bumps.passport;

        emit!(PassportCreated {
            passport: passport.key(),
            owner: passport.owner,
            serial_hash: passport.serial_hash.clone(),
            verifier_name: passport.verifier_name.clone(),
            created_at: now,
        });

        Ok(())
    }

    pub fn add_history(ctx: Context<AddHistory>, input: AddHistoryInput) -> Result<()> {
        validate_add_history_input(&input)?;

        let now = Clock::get()?.unix_timestamp;
        let passport = &mut ctx.accounts.passport;
        let history = &mut ctx.accounts.history_entry;

        history.passport = passport.key();
        history.verifier = ctx.accounts.verifier.key();
        history.entry_id = input.entry_id;
        history.kind = input.kind;
        history.title = input.title;
        history.notes = input.notes;
        history.verifier_name = input.verifier_name;
        history.created_at = now;
        history.bump = ctx.bumps.history_entry;

        passport.history_count = passport
            .history_count
            .checked_add(1)
            .ok_or_else(|| error!(RekaError::CounterOverflow))?;
        passport.trust_score = passport.trust_score.saturating_add(3).min(99);
        passport.updated_at = now;

        emit!(HistoryAdded {
            passport: passport.key(),
            history_entry: history.key(),
            verifier: history.verifier,
            kind: history.kind,
            created_at: now,
        });

        Ok(())
    }

    pub fn transfer_passport(
        ctx: Context<TransferPassport>,
        new_owner: Pubkey,
        new_owner_name: String,
    ) -> Result<()> {
        require_len(&new_owner_name, MAX_NAME_LEN)?;

        let now = Clock::get()?.unix_timestamp;
        let passport = &mut ctx.accounts.passport;
        let previous_owner = passport.owner;

        passport.owner = new_owner;
        passport.owner_name = new_owner_name;
        passport.transfer_count = passport
            .transfer_count
            .checked_add(1)
            .ok_or_else(|| error!(RekaError::CounterOverflow))?;
        passport.trust_score = passport.trust_score.saturating_add(2).min(99);
        passport.updated_at = now;

        emit!(PassportTransferred {
            passport: passport.key(),
            previous_owner,
            new_owner,
            transferred_at: now,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(input: CreatePassportInput)]
pub struct CreatePassport<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + DevicePassport::INIT_SPACE,
        seeds = [b"passport", input.serial_hash.as_bytes()],
        bump
    )]
    pub passport: Account<'info, DevicePassport>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(input: AddHistoryInput)]
pub struct AddHistory<'info> {
    #[account(mut)]
    pub passport: Account<'info, DevicePassport>,
    #[account(
        init,
        payer = verifier,
        space = 8 + HistoryEntry::INIT_SPACE,
        seeds = [b"history", passport.key().as_ref(), input.entry_id.as_bytes()],
        bump
    )]
    pub history_entry: Account<'info, HistoryEntry>,
    #[account(mut)]
    pub verifier: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferPassport<'info> {
    #[account(
        mut,
        has_one = owner @ RekaError::UnauthorizedOwner
    )]
    pub passport: Account<'info, DevicePassport>,
    pub owner: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreatePassportInput {
    pub category: String,
    pub brand: String,
    pub model: String,
    pub serial_hash: String,
    pub condition: String,
    pub battery_health: String,
    pub estimated_value: String,
    pub city: String,
    pub owner: Pubkey,
    pub owner_name: String,
    pub verifier_name: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AddHistoryInput {
    pub entry_id: String,
    pub kind: u8,
    pub title: String,
    pub notes: String,
    pub verifier_name: String,
}

#[account]
#[derive(InitSpace)]
pub struct DevicePassport {
    pub authority: Pubkey,
    pub owner: Pubkey,
    #[max_len(48)]
    pub owner_name: String,
    #[max_len(16)]
    pub category: String,
    #[max_len(32)]
    pub brand: String,
    #[max_len(64)]
    pub model: String,
    #[max_len(32)]
    pub serial_hash: String,
    #[max_len(24)]
    pub condition: String,
    #[max_len(16)]
    pub battery_health: String,
    #[max_len(24)]
    pub estimated_value: String,
    #[max_len(32)]
    pub city: String,
    #[max_len(48)]
    pub verifier_name: String,
    pub trust_score: u8,
    pub history_count: u32,
    pub transfer_count: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct HistoryEntry {
    pub passport: Pubkey,
    pub verifier: Pubkey,
    #[max_len(32)]
    pub entry_id: String,
    pub kind: u8,
    #[max_len(72)]
    pub title: String,
    #[max_len(280)]
    pub notes: String,
    #[max_len(48)]
    pub verifier_name: String,
    pub created_at: i64,
    pub bump: u8,
}

#[event]
pub struct PassportCreated {
    pub passport: Pubkey,
    pub owner: Pubkey,
    pub serial_hash: String,
    pub verifier_name: String,
    pub created_at: i64,
}

#[event]
pub struct HistoryAdded {
    pub passport: Pubkey,
    pub history_entry: Pubkey,
    pub verifier: Pubkey,
    pub kind: u8,
    pub created_at: i64,
}

#[event]
pub struct PassportTransferred {
    pub passport: Pubkey,
    pub previous_owner: Pubkey,
    pub new_owner: Pubkey,
    pub transferred_at: i64,
}

#[error_code]
pub enum RekaError {
    #[msg("One of the text fields is longer than the supported MVP limit.")]
    FieldTooLong,
    #[msg("History kind must be 0 inspection, 1 repair, 2 warranty, or 3 ownership.")]
    InvalidHistoryKind,
    #[msg("Only the current owner can transfer this passport.")]
    UnauthorizedOwner,
    #[msg("Counter overflow.")]
    CounterOverflow,
}

fn validate_create_passport_input(input: &CreatePassportInput) -> Result<()> {
    require_len(&input.category, MAX_CATEGORY_LEN)?;
    require_len(&input.brand, MAX_BRAND_LEN)?;
    require_len(&input.model, MAX_MODEL_LEN)?;
    require_len(&input.serial_hash, MAX_SERIAL_HASH_LEN)?;
    require_len(&input.condition, MAX_CONDITION_LEN)?;
    require_len(&input.battery_health, MAX_BATTERY_LEN)?;
    require_len(&input.estimated_value, MAX_VALUE_LEN)?;
    require_len(&input.city, MAX_CITY_LEN)?;
    require_len(&input.owner_name, MAX_NAME_LEN)?;
    require_len(&input.verifier_name, MAX_VERIFIER_LEN)?;
    Ok(())
}

fn validate_add_history_input(input: &AddHistoryInput) -> Result<()> {
    require_len(&input.entry_id, MAX_ID_LEN)?;
    require_len(&input.title, MAX_TITLE_LEN)?;
    require_len(&input.notes, MAX_NOTES_LEN)?;
    require_len(&input.verifier_name, MAX_VERIFIER_LEN)?;
    require!(input.kind <= 3, RekaError::InvalidHistoryKind);
    Ok(())
}

fn require_len(value: &str, max: usize) -> Result<()> {
    require!(value.as_bytes().len() <= max, RekaError::FieldTooLong);
    Ok(())
}
