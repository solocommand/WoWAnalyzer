import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';

import SPECS from 'game/SPECS';
import fetchWcl from 'common/fetchWclApi';
import CombatLogParser from 'parser/core/CombatLogParser';

const DAYS_PER_WEEK = 7;
const SECONDS_PER_DAY = 86400;
const TOTAL_SPECS = SPECS.count;
export const UNAVAILABLE = 'UNAVAILABLE';

class ThroughputPerformance extends React.PureComponent {
  static propTypes = {
    children: PropTypes.func.isRequired,
    metric: PropTypes.string.isRequired,
    throughput: PropTypes.number.isRequired,
  };
  static contextTypes = {
    parser: PropTypes.instanceOf(CombatLogParser).isRequired,
  };

  constructor() {
    super();
    this.state = {
      performance: null,
      topThroughput: null,
    };
  }
  componentDidMount() {
    this.load();
  }
  componentDidUpdate(prevProps, prevState, prevContext) {
    ReactTooltip.rebuild();
  }

  async load() {
    const { rankings } = await this.loadRankings();
    // We want the 100th rank to give people a reasonable and easy to grasp goal to aim for.
    const topRank = this._getRank(rankings, 100);
    if (!topRank) {
      this.setState({
        performance: UNAVAILABLE,
        topThroughput: UNAVAILABLE,
      });
      return;
    }
    const topThroughput = topRank.total;
    this.setState({
      // If the player is in the top 100, this may be >=100%.
      performance: this.props.throughput / topThroughput,
      topThroughput,
    });
  }
  async loadRankings() {
    const parser = this.context.parser;

    // TODO: Move this to a method that can be shared with the EncounterStats component
    return fetchWcl(`rankings/encounter/${parser.fight.boss}`, {
      class: parser.selectedCombatant.spec.ranking.class,
      spec: parser.selectedCombatant.spec.ranking.spec,
      difficulty: parser.fight.difficulty,
      metric: this.props.metric,
      // hehe jk this is actually the opposite of a cache key since without this it would be cached indefinitely. This is more like a "cache bust key" in that this changes weekly so that it auto-refreshes weekly. Super clever.
      cache: this._getCacheKey(parser.selectedCombatant.spec.index),
    });
  }
  _getCacheKey(specIndex) {
    // We want to stagger the requests so not all specs are refreshed at the same time.
    // We achieve this by adding a static amount of time to `now` based on the spec index (0-35).
    const secondsOffset = (DAYS_PER_WEEK * SECONDS_PER_DAY * specIndex / TOTAL_SPECS);
    // We mutate now so that if there's a year crossover it will properly go to week 1 instead of 53/54
    const now = new Date((new Date()).getTime() + (secondsOffset * 1000));
    // We need this to calculate the amount of weeks difference
    const onejan = new Date(now.getFullYear(), 0, 1);
    // Calculate the current week number
    return Math.ceil((((now - onejan) / SECONDS_PER_DAY / 1000) + onejan.getDay() + 1) / DAYS_PER_WEEK); // current calendar-week
  }
  _getRank(rankings, desiredRank) {
    return rankings[desiredRank - 1];
  }

  render() {
    const { children } = this.props;

    return children(this.state);
  }
}

export default ThroughputPerformance;