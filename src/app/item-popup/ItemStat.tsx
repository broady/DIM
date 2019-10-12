import React from 'react';
import { DimStat, DimItem, D1Stat } from 'app/inventory/item-types';
import { statsMs } from 'app/inventory/store/stats';
import RecoilStat from './RecoilStat';
import { percent, getColor } from 'app/shell/filters';
import clsx from 'clsx';
import BungieImage from 'app/dim-ui/BungieImage';
import idx from 'idx';
import _ from 'lodash';
import { t } from 'app/i18next-t';

/**
 * A single stat line.
 */
export default function ItemStat({ stat, item }: { stat: DimStat; item: DimItem }) {
  const value = stat.value;
  const isMasterworkedStat =
    item.isDestiny2() && item.masterworkInfo && stat.statHash === item.masterworkInfo.statHash;
  const masterworkValue =
    (item.isDestiny2() && item.masterworkInfo && item.masterworkInfo.statValue) || 0;

  const moddedStatValue = getModdedStatValue(item, stat);
  const isModdedStat = moddedStatValue !== 0;

  let baseBar = value;
  if (isMasterworkedStat && masterworkValue > 0) {
    baseBar -= masterworkValue;
  }
  if (isModdedStat) {
    baseBar -= moddedStatValue;
  }

  const segments: [number, string?][] = [[baseBar]];

  if (isMasterworkedStat && masterworkValue > 0) {
    segments.push([masterworkValue, 'masterwork-stats']);
  }
  if (isModdedStat) {
    segments.push([moddedStatValue, 'modded-stats']);
  }

  const displayValue = value;

  return (
    <div
      className={clsx('stat-box-row', {
        masterworked: isMasterworkedStat,
        modded: isModdedStat
      })}
      title={stat.displayProperties.description}
    >
      <span className="stat-box-text stat-box-cell">{stat.displayProperties.name}</span>

      <span className="stat-box-val stat-box-cell">
        {stat.additive && '+'}
        {displayValue}
      </span>

      {statsMs.includes(stat.statHash) && (
        <span className="stat-box-cell stat-box-trailer">{t('Stats.Milliseconds')}</span>
      )}

      {stat.displayProperties.hasIcon && (
        <span className="stat-box-cell stat-box-icon">
          <BungieImage className="stat-icon" src={stat.displayProperties.icon} />
        </span>
      )}

      {isD1Stat(item, stat) && stat.qualityPercentage && stat.qualityPercentage.min > 0 && (
        <span
          className="stat-box-cell item-stat-quality stat-box-trailer"
          style={getColor(stat.qualityPercentage.min, 'color')}
        >
          ({stat.qualityPercentage.range})
        </span>
      )}

      {stat.statHash === 2715839340 && (
        <span className="stat-recoil">
          <RecoilStat stat={stat} />
        </span>
      )}

      {stat.bar && (
        <span className={clsx('stat-box-outer')}>
          <span className="stat-box-container">
            {segments.map(([val, className], index) => (
              <span
                key={index}
                className={clsx('stat-box-inner', className)}
                style={{ width: percent(val / stat.maximumValue) }}
              />
            ))}
          </span>
        </span>
      )}
    </div>
  );
}

/*
 * Looks through the item sockets to find any weapon/armor mods that modify this stat (could be
 * multiple armor mods as of Shadowkeep). Returns the total value the stat is modified by, or 0 if
 * it is not being modified.
 */
function getModdedStatValue(item: DimItem, stat: DimStat) {
  const modSockets =
    (item.isDestiny2() &&
      item.sockets &&
      item.sockets.sockets.filter((socket) => {
        const categories = idx(socket, (socket) => socket.plug.plugItem.itemCategoryHashes) || [];
        return (
          // these are the item category hashes for weapon mods and armor mods respectively
          (categories.includes(1052191496) || categories.includes(4062965806)) &&
          // we only care about the ones that modify this stat
          Object.keys(idx(socket, (socket) => socket.plug.stats) || {}).includes(
            String(stat.statHash)
          )
        );
      })) ||
    [];

  return _.sum(
    modSockets.map((socket) =>
      socket.plug && socket.plug.stats ? socket.plug.stats[stat.statHash] : 0
    )
  );
}

function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.isDestiny1();
}
