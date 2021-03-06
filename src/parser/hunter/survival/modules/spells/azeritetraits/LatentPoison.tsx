import React from 'react';
import Analyzer from 'parser/core/Analyzer';
import SPELLS from 'common/SPELLS';
import { RAPTOR_MONGOOSE_VARIANTS } from 'parser/hunter/survival/constants';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import Statistic from 'interface/statistics/Statistic';
import { ApplyDebuffEvent, ApplyDebuffStackEvent, CastEvent, DamageEvent, RemoveDebuffEvent } from 'parser/core/Events';
import STATISTIC_CATEGORY from 'interface/others/STATISTIC_CATEGORY';

/**
 * Serpent Sting damage applies Latent Poison, stacking up to 10 times. Your Mongoose Bite or Raptor Strike consumes all applications of Latent Poison to deal 451 Nature damage per stack.
 *
 * Example log:
 * https://www.warcraftlogs.com/reports/nYXazkPpFwDrK3mh#fight=75&type=damage-done&source=692&translate=true&ability=273289
 */

const MAX_STACKS = 10;

class LatentPoison extends Analyzer {

  applications = 0;
  _stacks = 0;
  maxPossible = 0;
  wasted = 0;
  utilised = 0;
  casts = 0;
  spellKnown = null;

  constructor(options: any) {
    super(options);
    this.active = this.selectedCombatant.hasTrait(SPELLS.LATENT_POISON.id);
    this.spellKnown = this.selectedCombatant.hasTalent(SPELLS.MONGOOSE_BITE_TALENT.id) ? SPELLS.MONGOOSE_BITE_TALENT.name : SPELLS.RAPTOR_STRIKE.name;
  }

  get averageStacksPerRaptorOrMongoose() {
    return this.utilised / this.casts;
  }

  on_byPlayer_applydebuff(event: ApplyDebuffEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.LATENT_POISON_DEBUFF.id) {
      return;
    }
    this.applications += 1;
    this._stacks = 1;
  }

  on_byPlayer_applydebuffstack(event: ApplyDebuffStackEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.LATENT_POISON_DEBUFF.id) {
      return;
    }
    this.applications += 1;
    this._stacks = event.stack;
  }

  on_byPlayer_removedebuff(event: RemoveDebuffEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.LATENT_POISON_DEBUFF.id) {
      return;
    }
    this._stacks = 0;
  }

  on_byPlayer_damage(event: DamageEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.SERPENT_STING_SV.id) {
      return;
    }
    this.maxPossible += 1;
    if (this._stacks === MAX_STACKS) {
      this.wasted += 1;
    }
  }

  on_byPlayer_cast(event: CastEvent) {
    const spellId = event.ability.guid;
    if (!RAPTOR_MONGOOSE_VARIANTS.includes(spellId)) {
      return;
    }
    this.utilised += this._stacks;
    this.casts += 1;
  }

  statistic() {
    this.wasted = this.maxPossible - this.utilised;
    return (
      <Statistic
        size="flexible"
        category={STATISTIC_CATEGORY.AZERITE_POWERS}
        tooltip={(
          <>
            {this.wasted > 0 &&
            <> You wasted {this.wasted} stacks by not casting {this.spellKnown} at the target with {MAX_STACKS} stacks on them, or if the mob died while it had stacks on it.</>}
          </>
        )}
      >
        <BoringSpellValueText spell={SPELLS.LATENT_POISON}>
          <>
            {this.utilised} / {this.maxPossible} <small>possible stack consumes</small><br />
            {this.averageStacksPerRaptorOrMongoose.toFixed(1)} <small>stacks per {this.spellKnown}</small>
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default LatentPoison;
