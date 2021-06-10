type GranblueResponse = {
    base64Encoded?: boolean;
    body: string;
};
export function isGranblueResponse(v: any): v is GranblueResponse {
    return (
        v?.hasOwnProperty("base64Encoded") &&
        v.base64Encoded === false &&
        v.hasOwnProperty("body") &&
        typeof v.body === "string"
    );
}

type Ability = {
    alive: number;
    list: {}[];
    mode: string;
    pos: number;
    src: string;
};

type Treasure = {
    treasure_type_1: number;
    treasure_type_2: number;
    treasure_type_3: number;
    treasure_type_4: number;
    treasure_type_5: number;
    treasure_type_11: number;
    treasure_type_13: number;
};

type Potion = {
    count: string;
    item_name: string;
    limit_remain: number;
    limit_number: number;
    limit_flg: boolean;
    battle_icon_type: string;
};

type Boss = {
    type: string;
    number: number;
    modechange: string;
    modegauge: 0;
    star: number;
    param: {}[]; // This is each stage of the fight
};

type FightStart = {
    0: string;
    ability: Ability[];
    ability_popup_flag: number;
    ability_rail_disp: number;
    ability_rail_use: number;
    auto_attack_display_flag: number;
    avm: string;
    background: string;
    background_image_any: {}[];
    balloon: { boss: { pos: number; serif: string; voice: null }[] };
    base_fps: number;
    battle: { total: number; count: string };
    battle_auto_type: number;
    bgm: string;
    bgm_setting: { is_change_bgm: boolean; bgm: null };
    boss: Boss;
    chain_burst_gauge: string;
    chat_button_flag: number;
    chat_receive_flag: number;
    chat_stamp_flag: number;
    collabo_type: null;
    diagram_flag: number;
    disp_hp_percent_disp: number;
    duplicate_key: number;
    effect_mode: number;
    event_code: string;
    event_status: number;
    fellow: number;
    field_effect: {}[];
    fix_bgm: boolean;
    formation: string[];
    guild: number;
    is_arcade: boolean;
    is_arcarum: boolean;
    is_ascendant: boolean;
    is_auto_guard: number;
    is_board: boolean;
    is_dungeon: boolean;
    is_escorted_character_dead: number;
    is_guests_allowed_to_request_assistance: number;
    is_multi_ability_notification: number;
    is_rare: boolean;
    is_replicard: boolean;
    is_riddle: number;
    is_sequence: boolean;
    is_show_assist_popup_auto: number;
    is_show_autoattack_setting_text: number;
    is_show_coating_value: number;
    is_skip_to_request_assistance: number;
    is_start_battle_navi_first_priority: boolean;
    is_survival: boolean;
    is_tower: boolean;
    is_trialbattle: boolean;
    key_enemy_mode: number;
    location_id: string;
    lupi: number;
    lyria_num: number;
    lyria_pos: number;
    mini_chat_stamp: number;
    move_background: string;
    multi: number;
    next: string;
    nickname: string;
    no_disp_turn: string;
    no_skill_battle: string;
    others_effect_display_flag: number;
    participant_type: number;
    player: {
        type: string;
        number: number;
        param: {}[]; // The team
        job_is_formchange: string;
    };
    potion: Potion;
    quest_id: string;
    raid_id: number;
    serif: number;
    shop_lowest_price: string;
    shop_potion_id: number;
    skin_coop: number;
    skin_multi_member_info: number;
    skin_node: number;
    skip_special_motion_setting: {}[];
    special_skill_flag: string;
    stone: string;
    suddenly_attack_flag: boolean;
    summon: {}[];
    summon_enable: number;
    summon_speed: number;
    supporter: {
        attribute: string;
        available_skill: boolean;
        comment: string;
        detail: string;
        evolution: string;
        evolution_flag: number;
        friend: boolean;
        id: string;
        image_id: string;
        level: string;
        name: string;
        protection: string;
        protection_name: string;
        quality: string;
        recast: string;
        require: string;
        skill: string;
        special_once_flag: boolean;
        start_recast: string;
    };
    temporary: {
        cmd: string;
        small: string;
        large: string;
        temporary_potion_one_battle_icon_type: string;
        temporary_potion_all_battle_icon_type: string;
    };
    temporary_potion_all_name: string;
    temporary_potion_one_name: string;
    timer: number;
    treasure: Treasure;
    turn: number;
    turn_waiting: number;
    use_ap: boolean;
    voice_stamp: number;
    weapon: { weapon_l: string; weapon_r: string };
    weapon_kind: { weapon_l: string; weapon_r: string };
    without_pc: string;
    without_summon: boolean;
};

export function isFightStart(v: any): v is FightStart {
    return (
        v?.hasOwnProperty("treasure") &&
        v?.hasOwnProperty("quest_id") &&
        v?.hasOwnProperty("raid_id") &&
        v?.hasOwnProperty("nickname")
    );
}

type Weapon = {
    class_name: string;
    count: string;
    disable: boolean;
    id: string;
    is_discoverer: boolean;
    is_mvp: boolean;
    is_raid: boolean;
    item_kind: string;
    name: string;
    rarity: string;
    type: string;
};

export type Rewards = {
    accumulate_exp_result: [];
    article_list: [];
    auto_custom_info: [];
    auto_custom_list: [];
    auto_custom_weapon_count: number;
    auto_recycling_summon_list: [];
    auto_recycling_weapon_list: {
        [key: number]: {
            [key: string]: Weapon;
        };
    };
    auto_sell_list: [];
    auto_sell_summon_count: number;
    auto_sell_weapon_count: number;
    converting_count_summon: number;
    converting_count_weapon: number;
    converting_exp_summon: number;
    converting_exp_weapon: number;
    is_money_max: boolean;
    is_recycling_item_summon_max: boolean;
    is_recycling_item_weapon_max: boolean;
    lupi: number;
    new_item_list: { weapon: Weapon[] };
    prefix: string;
    recycling_item_summon_id: number;
    recycling_item_weapon_accumulation_exp: number;
    recycling_item_weapon_get_number: number;
    recycling_item_weapon_id: number;
    recycling_item_weapon_max_exp: string;
    recycling_item_weapon_name: string;
    reward_list: {
        1: { [key: string]: Weapon } | [];
        2: { [key: string]: Weapon } | [];
        3: { [key: string]: Weapon } | [];
        4: { [key: string]: Weapon } | [];
        11: { [key: string]: Weapon } | [];
        13: { [key: string]: Weapon } | [];
    };
    sold_price: number;
    weapon_converting_exp: number;
};

type Appearance = {
    chapter_id: string;
    event_id: string;
    event_name: string;
    event_switch_kind: null;
    event_type: string;
    group_id: string;
    is_normal_hell: {
        type: boolean;
    };
    is_quest: boolean;
    location_id: string;
    open_chapter_id: string;
    quest_id: string;
    quest_name: string; // Full Quest Name
    quest_skip: {
        chapter_id: string;
        is_quest_skip: boolean;
        quest_id: string;
        quest_skip_status: string;
    };
    quest_type: string;
    title: string; // Name of quest
};

type QuestComplete = {
    advent_info: {
        contribution: number;
        default_point: number;
        final_point: number;
        has_point_rate: boolean;
        is_ordeal_quest: boolean;
        is_over_limit: boolean;
    };
    appearance: Appearance;
    bgm_setting: { is_change_bgm: boolean; bgm: null };
    campaign_quest_comment: null;
    character_message: {
        ability_item_info: [];
        treasure_flag_151: boolean;
        treasure_flag_152: boolean;
    };
    cjs_data: [];
    commu_pop_message: [];
    event: {
        is_get: boolean;
        event_code: string;
        data: {
            get_bonus_num: number;
            get_num: number;
            guild_contribution: boolean;
            item_dir: string;
            item_image: string;
            name: string;
            restriction_msg_teamraid: boolean;
            solotreasure_finished: boolean;
            treasureraid_contribution: boolean;
        }[];
    };
    has_not_receive_reward: boolean;
    irregular_campaign_info: [];
    is_arcade: boolean;
    is_move_event_top: boolean;
    is_solotreasure: boolean;
    is_story_contribution: boolean;
    is_survival: boolean;
    mbp_info: [];
    pair_quest: { is_first_clear: boolean };
    popup_data: {}; // Looks mostly useless for us, but there's a lot in here
    present_flgs: { weapon: boolean; summon: boolean; money: boolean; all: boolean };
    quest_type: string;
    retry_quest_info: {
        action_point: string;
        chapter_id: string;
        chapter_name: string;
        is_short_use_item: boolean;
        quest_id: string;
        quest_type: string;
        start_at_once: string;
    };
    rewards: Rewards;
    skyscope_achieved_mission: {};
    stone_info: [];
    treasurequest: [];
    url: string;
    values: {}; // Character/Team Data
};

export function isQuestComplete(v: any): v is QuestComplete {
    return !!(v && v.rewards?.reward_list && v.appearance.title && v.appearance.quest_name);
}

type UserData = {
    id: string;
    nickname: string;
    prefix: string;
    token: string;
    user_image: string;
};

export function isUserData(v: any): v is UserData {
    return !!(v && v.nickname && v.id);
}

type BattleUserData = {
    0: string;
    ability: { [key: number]: Ability };
    ability_popup_flag: number;
    ability_rail_disp: number;
    ability_rail_use: number;
    ability_turn: number;
    assist: {};
    auto_attack_display_flag: number;
    avm: string;
    background: "/sp/raid/bg/common_026.jpg";
    background_image_object: [];
    balloon: { boss: [] };
    base_fps: number;
    battle: { total: number; count: 1 };
    battle_auto_type: number;
    bgm: string;
    bgm_setting: { is_change_bgm: boolean; bgm: null };
    boss: Boss;
    chain_burst_gauge: string;
    chat: { [key: number]: {} };
    chat_button_flag: number;
    chat_receive_flag: number;
    chat_stamp_flag: number;
    chat_temporary_flag: number;
    cheer_effect_text: string;
    cheer_status: boolean;
    diagram_flag: number;
    disp_hp_percent_disp: number;
    duplicate_key: number;
    effect_mode: number;
    event_id_of_semi: null;
    fellow: number;
    field_effect: [];
    fix_bgm: boolean;
    formation: [];
    friend_ids: { [key: string]: string };
    guild: number;
    guild_id: string;
    guild_member_ids: { [key: number]: number };
    has_item_consume_startbonus: boolean;
    is_allowed_to_requesting_assistance: boolean;
    is_authority: boolean;
    is_auto_guard: number;
    is_boss: string;
    is_coopraid: boolean;
    is_defendorder: boolean;
    is_dungeon: boolean;
    is_escorted_character_dead: number;
    is_guests_allowed_to_request_assistance: number;
    is_host: boolean;
    is_lobby: boolean;
    is_multi_ability_notification: number;
    is_notice_poped_enemy: boolean;
    is_one_shot_attack_quest: boolean;
    is_one_shot_kill_exec: boolean;
    is_poped_enemy_quest: boolean;
    is_rare: boolean;
    is_restrict_assist: boolean;
    is_semi: boolean;
    is_show_assist_popup_auto: number;
    is_show_autoattack_setting_text: number;
    is_show_coating_value: number;
    is_skip_to_request_assistance: number;
    is_special_battle: boolean;
    is_team_force: boolean;
    is_use_pushed_npc: boolean;
    is_watching: null;
    key_enemy_mode: number;
    limit_number: string;
    lupi: number;
    lyria_num: -1;
    lyria_pos: -1;
    microtime: string;
    mini_chat_stamp: number;
    multi: number;
    multi_raid_member_info: {}[];
    mvp_info: [];
    nickname: string;
    others_effect_display_flag: number;
    player: {};
    pop_up_flg: boolean;
    potion: Potion;
    raid_id: number;
    serif: number;
    shop_lowest_price: string;
    shop_potion_id: number;
    skin_coop: number;
    skin_multi_member_info: number;
    skin_node: number;
    skip_special_motion_setting: [];
    special_skill_flag: string;
    stone: string;
    suddenly_attack_flag: boolean;
    summon: {}[];
    summon_enable: number;
    summon_speed: number;
    supporter: {};
    switching_hp_gauge: boolean;
    temporary: {
        cmd: string;
        small: string;
        large: number;
        temporary_potion_one_battle_icon_type: string;
        temporary_potion_all_battle_icon_type: string;
    };
    temporary_potion_all: { assist: number; chat: 1 };
    temporary_potion_all_name: string;
    temporary_potion_one_name: string;
    timer: number;
    treasure: Treasure;
    turn: number;
    turn_waiting: number;
    twitter: {
        raid_id: string;
        enemy_id: string;
        battle_id: string;
        monster: string;
        image: string;
    };
    user_id: string;
    viewer_id: string;
    voice_stamp: number;
    weapon: { weapon: string };
    weapon_kind: { weapon: string };
};

export function isBattleUserData(v: any): v is BattleUserData {
    return !!(v && v.nickname && v.user_id);
}

type RaidCompleteData = {
    advent_info: {};
    appearance: null;
    bgm_setting: { is_change_bgm: boolean; bgm: null };
    character_message: { ability_item_info: []; treasure_flag_151: boolean; treasure_flag_152: boolean };
    commu_pop_message: [];
    dop_info: [];
    event: { is_get: boolean; data: {}[] };
    has_not_receive_reward: boolean;
    irregular_campaign_info: [];
    is_solotreasure: boolean;
    mbp_info: [];
    pair_quest: { is_first_clear: boolean };
    popup_data: {};
    retry_quest_info: null;
    rewards: Rewards;
    skyleap_point_info: [];
    skyscope_achieved_mission: {};
    stone_info: [];
    treasurequest: [];
    url: string;
    values: {};
};

export function RaidCompleteData(v: any): v is RaidCompleteData {
    return !!(v && v.rewards?.reward_list && v.appearance === null);
}

export type BattleWithRewards = {
    rewards: Rewards;
    appearance?: Appearance;
};

export function BattleHasRewards(v: any): v is BattleWithRewards {
    return !!v?.rewards?.reward_list;
}
