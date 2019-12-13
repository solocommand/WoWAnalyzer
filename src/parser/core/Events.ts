import React from 'react';

import { END_EVENT_TYPE } from 'parser/shared/normalizers/FightEnd';
import {
  PHASE_START_EVENT_TYPE,
  PHASE_END_EVENT_TYPE,
} from 'common/fabricateBossPhaseEvents';
import {
  PRE_FILTER_BUFF_EVENT_TYPE,
  PRE_FILTER_COOLDOWN_EVENT_TYPE,
} from 'interface/report/TimeEventFilter';
import EventFilter from './EventFilter';

enum EventType {
  Heal = 'heal',
  HealAbsorbed = 'healabsorbed',
  Absorbed = 'absorbed',
  Damage = 'damage',
  BeginCast = 'begincast',
  Cast = 'cast',
  ApplyBuff = 'applybuff',
  ApplyDebuff = 'applydebuff',
  ApplyBuffStack = 'applybuffstack',
  ApplyDebuffStack = 'applydebuffstack',
  RemoveBuffStack = 'removebuffstack',
  RemoveDebuffStack = 'removedebuffstack',
  RefreshBuff = 'refreshbuff',
  RefreshDebuff = 'refreshdebuff',
  RemoveBuff = 'removebuff',
  RemoveDebuff = 'removedebuff',
  Summon = 'summon',
  Energize = 'energize',
  Interrupt = 'interrupt',
  Death = 'death',
  Resurrect = 'resurrect',
}
export interface Event {
  type: EventType;
  timestamp: number;
}
export interface CastEvent extends Event {
  type: EventType.Cast;
  ability: {
    guid: number;
  };
  meta?: {
    isInefficientCast?: boolean;
    inefficientCastReason?: React.ReactNode;
  };
}
export interface HealEvent extends Event {
  type: EventType.Heal;
  amount: number;
  absorbed: number;
}
export interface DamageEvent extends Event {
  type: EventType.Damage;
  amount: number;
  absorbed: number;
}

const Events = {
  /**
   * BEWARE: These events/properties are NOT COMPLETE. See the Event log for a full list of available props and events.
   *
   * Generic props:
   * - timestamp: the timestamp of the event, relative to log start
   * - type: the event type, you should generally not use this and properly separate event listeners.
   * - sourceID: who initiated the event
   * - sourceIsFriendly: whether the source was friendly to the selected player
   * - targetID: who was affected by the event
   * - targetIsFriendly: whether the target was friendly to the selected player. BEWARE: @Any dps classes: make sure if you do a damage statistic that you do NOT include friendly fire to other players (such as from Aura of Sacrifice). This does not gain any damage bonuses.
   * - ability: object of the ability/spell involved. Shape: { name, guid, type: I believe this is the magic school type, abilityIcon }
   * - resourceActor:
   * - classResources: array of resources (mana, energy, etc)
   * - hitPoints: for healing these are the hitpoints AFTER the event's modifications are applied, for other events it might be before? you should check to make sure for damage, energize and such events
   * - maxHitPoints: this max amount of hitpoints of the target
   * - attackPower:
   * - spellPower:
   * - x: x location on the map. See paladin/holy/modules/features/MasteryEffectiveness for an example module that uses this data.
   * - y: y location on the map
   * - facing: the direction the player is facing
   * - sourceMarker:
   * - targetMarker:
   * - mapID:
   * - itemLevel:
   */

  /**
   * This event is called for events where the player, a player pet or a target of the player/player pet dealt or took damage.
   * Event specific props:
   * - amount: effective damage
   * - absorbed: damage absorbed by a buff on the target (e.g. https://www.wowhead.com/spell=269279/resounding-protection). This should generally be considered effective damage.
   * - overkill: if the target died, this is the amount of damage that exceeded their remaining health
   * - hitType:
   * - mitigated:
   * - unmitigatedAmount:
   * - tick:
   *
   * NOTE: Do not use this event to track absorb-healing (e.g. by a spell such as Resounding Protection). Use the `absorbed` event instead.
   * @returns {EventFilter}
   */
  get damage() {
    return new EventFilter(EventType.Damage);
  },
  /**
   * This event is called for events where the player, a player pet or a target of the player/player pet was healed.
   * Event specific props:
   * - amount: effective healing
   * - absorbed: healing absorbed by a debuff on the target (e.g. https://www.wowhead.com/spell=233263/embrace-of-the-eclipse). This should generally be considered effective healing.
   * - overheal: overhealing
   * @returns {EventFilter}
   */
  get heal() {
    return new EventFilter(EventType.Heal);
  },
  /**
   * Triggered in addition to the regular heal event whenever a heal is absorbed. Can be used to determine what buff or debuff was absorbing the healing.
   * NOTE: This should only be used if you need to know **which ability soaked the healing**. If you want to track the amount of absorbed healing by a spell, use the `absorb` prop of the `heal` event.
   * @returns {EventFilter}
   */
  get healabsorbed() {
    return new EventFilter(EventType.HealAbsorbed);
  },
  /**
   * This event is called for events where the player, a player pet or a target of the player/player pet was healed.
   * Event specific props:
   * - ability: The ability responsible for absorbed damage (i.e. the shield)
   * - amount: effective damage absorbed
   * - attackerID:
   * - attackerIsFriendly:
   * - extraAbility: The damage ability that was absorbed
   * @returns {EventFilter}
   */
  get absorbed() {
    return new EventFilter(EventType.Absorbed);
  },
  /**
   * This event is called when the player begins casting an ability that has a cast time. This is also called for some channeled abilities, but not everyone. This is NOT cast for most instant abilities.
   * @returns {EventFilter}
   */
  get begincast() {
    return new EventFilter(EventType.BeginCast);
  },
  /**
   * This event is called when the player successfully cast an ability.
   * BEWARE: Blizzard also sometimes uses this event type for mechanics and spell ticks or bolts. This can even occur in between a begincast and cast finish!
   * @returns {EventFilter}
   */
  get cast() {
    return new EventFilter(EventType.Cast);
  },
  /**
   * Event specific props:
   * - absorb: If the buff can absorb damage, the size of the shield.
   * @returns {EventFilter}
   */
  get applybuff() {
    return new EventFilter(EventType.ApplyBuff);
  },
  /**
   * Event specific props:
   * - absorb: If the buff can absorb healing (maybe there are debuffs that absorb damage too?), this reflects the size of the (healing) absorb.
   * @returns {EventFilter}
   */
  get applydebuff() {
    return new EventFilter(EventType.ApplyDebuff);
  },
  get applybuffstack() {
    return new EventFilter(EventType.ApplyBuffStack);
  },
  get applydebuffstack() {
    return new EventFilter(EventType.ApplyDebuffStack);
  },
  /**
   * Event specific props:
   * - stack
   * @returns {EventFilter}
   */
  get removebuffstack() {
    return new EventFilter(EventType.RemoveBuffStack);
  },
  /**
   * Event specific props:
   * - stack
   * @returns {EventFilter}
   */
  get removedebuffstack() {
    return new EventFilter(EventType.RemoveDebuffStack);
  },
  get refreshbuff() {
    return new EventFilter(EventType.RefreshBuff);
  },
  get refreshdebuff() {
    return new EventFilter(EventType.RefreshDebuff);
  },
  /**
   * Event specific props:
   * - absorb: If the buff could absorb damage, the size of the shield remaining. This is UNUSED/WASTED damage absorb.
   * @returns {EventFilter}
   */
  get removebuff() {
    return new EventFilter(EventType.RemoveBuff);
  },
  /**
   * Event specific props:
   * - absorb: If the buff could absorb healing (maybe there are debuffs that absorb damage too?), this reflects the size of the (healing) absorb.
   * @returns {EventFilter}
   */
  get removedebuff() {
    return new EventFilter(EventType.RemoveDebuff);
  },
  get summon() {
    return new EventFilter(EventType.Summon);
  },
  get energize() {
    return new EventFilter(EventType.Energize);
  },
  get interrupt() {
    return new EventFilter(EventType.Interrupt);
  },
  get death() {
    return new EventFilter(EventType.Death);
  },
  get resurrect() {
    return new EventFilter(EventType.Resurrect);
  },
  get fightend() {
    return new EventFilter(END_EVENT_TYPE);
  },
  get phasestart() {
    return new EventFilter(PHASE_START_EVENT_TYPE);
  },
  get phaseend() {
    return new EventFilter(PHASE_END_EVENT_TYPE);
  },
  get prefiltercd() {
    return new EventFilter(PRE_FILTER_COOLDOWN_EVENT_TYPE);
  },
  get prefilterbuff() {
    return new EventFilter(PRE_FILTER_BUFF_EVENT_TYPE);
  },
};

export default Events;