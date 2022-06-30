import { t, Trans } from '@lingui/macro';
import RelativeTime from '@yaireo/relative-time';
import { useState, useEffect } from 'react';
import { sprintf } from 'sprintf-js';
import { DataCenter } from '../../../types/game/DataCenter';
import { Item } from '../../../types/game/Item';
import ListingsTable from '../../ListingsTable/ListingsTable';
import SalesTable from '../../SalesTable/SalesTable';
import MarketHistoryGraph from '../MarketHistoryGraph/MarketHistoryGraph';
import MarketServerUpdateTimes from '../MarketServerUpdateTimes/MarketServerUpdateTimes';
import MarketStackSizeHistogram from '../MarketStackSizeHistogram/MarketStackSizeHistogram';

interface MarketDataCenterProps {
  item: Item;
  dc: DataCenter;
}

function entriesToShow(entries: {}[]) {
  return Math.max(Math.floor(entries.length * 0.1), 10);
}

export default function MarketDataCenter({ item, dc }: MarketDataCenterProps) {
  const [markets, setMarkets] = useState<Record<number, any>>({});
  useEffect(() => {
    (async () => {
      setMarkets({});

      for (const world of dc.worlds) {
        const market = await fetch(`https://universalis.app/api/v2/${world.id}/${item.id}`).then(
          (res) => res.json()
        );
        setMarkets((last) => ({ ...last, ...{ [world.id]: market } }));
      }
    })();
  }, [dc.worlds, item.id]);

  const worldsSorted = dc.worlds.sort((a, b) => a.name.localeCompare(b.name));
  const relativeTime = new RelativeTime();

  if (Object.keys(markets).length !== dc.worlds.length) {
    return <></>;
  }

  const allListings = Object.values(markets)
    .map((market) =>
      market.listings.map((listing: any) => {
        listing.worldName = market.worldName;
        return listing;
      })
    )
    .flat()
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const allSales = Object.values(markets)
    .map((market) =>
      market.recentHistory.map((listing: any) => {
        listing.worldName = market.worldName;
        return listing;
      })
    )
    .flat()
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit);

  const hqListings = allListings.filter((listing) => listing.hq);
  const nqListings = allListings.filter((listing) => !listing.hq);
  const hqSales = allSales.filter((sale) => sale.hq);
  const nqSales = allSales.filter((sale) => !sale.hq);

  const hqListingsAveragePpu = Math.ceil(
    hqListings.map((listing) => listing.pricePerUnit).reduce((agg, next) => agg + next, 0) /
      hqListings.length
  );
  const nqListingsAveragePpu = Math.ceil(
    nqListings.map((listing) => listing.pricePerUnit).reduce((agg, next) => agg + next, 0) /
      nqListings.length
  );
  const hqListingsAverageTotal = Math.ceil(
    hqListings.map((listing) => listing.total).reduce((agg, next) => agg + next, 0) /
      hqListings.length
  );
  const nqListingsAverageTotal = Math.ceil(
    nqListings.map((listing) => listing.total).reduce((agg, next) => agg + next, 0) /
      nqListings.length
  );
  const hqSalesAveragePpu = Math.ceil(
    hqSales.map((sale) => sale.pricePerUnit).reduce((agg, next) => agg + next, 0) / hqSales.length
  );
  const nqSalesAveragePpu = Math.ceil(
    nqSales.map((sale) => sale.pricePerUnit).reduce((agg, next) => agg + next, 0) / nqSales.length
  );
  const hqSalesAverageTotal = Math.ceil(
    hqSales.map((sale) => sale.total).reduce((agg, next) => agg + next, 0) / hqSales.length
  );
  const nqSalesAverageTotal = Math.ceil(
    nqSales.map((sale) => sale.total).reduce((agg, next) => agg + next, 0) / nqSales.length
  );

  return (
    <>
      <MarketServerUpdateTimes worlds={worldsSorted} uploadTimes={markets} />
      <div className="cross_world_markets">
        <div className="cheapest">
          <h2>{sprintf(t`Cheapest %s`, 'HQ')}</h2>
          {item.canBeHq && (
            <>
              {hqListings.length > 0 && (
                <div className="cheapest_price">
                  <i className="xiv-Gil"></i> <em>{hqListings[0].quantity.toLocaleString()} x</em>
                  <span className="cheapest_value">
                    &nbsp;
                    {hqListings[0].pricePerUnit.toLocaleString()}
                  </span>
                  &nbsp;
                  <span className="cheapest_price_info">
                    <Trans>Server:</Trans> <strong>{hqListings[0].worldName}</strong> -&nbsp;
                    <Trans>Total:</Trans> <strong>{hqListings[0].total.toLocaleString()}</strong>
                  </span>
                </div>
              )}
              {hqListings.length === 0 && sprintf(t`No %s for sale.`, 'HQ')}
            </>
          )}
          {!item.canBeHq && t`Item has no HQ variant.`}
        </div>
        <div className="cheapest">
          <h2>{sprintf(t`Cheapest %s`, 'NQ')}</h2>

          {nqListings.length > 0 && (
            <div className="cheapest_price">
              <i className="xiv-Gil"></i> <em>{nqListings[0].quantity.toLocaleString()} x</em>
              <span className="cheapest_value">
                &nbsp;
                {nqListings[0].pricePerUnit.toLocaleString()}
              </span>
              &nbsp;
              <span className="cheapest_price_info">
                <Trans>Server:</Trans> <strong>{nqListings[0].worldName}</strong> -&nbsp;
                <Trans>Total:</Trans> <strong>{nqListings[0].total.toLocaleString()}</strong>
              </span>
            </div>
          )}
          {nqListings.length === 0 && sprintf(t`No %s for sale.`, 'NQ')}
        </div>
      </div>
      <br />
      <br />
      <h6>
        <Trans>Cross-World Purchase history (500 sales)</Trans>
      </h6>
      <MarketHistoryGraph server={dc.name} itemId={item.id} />
      {item.stackSize && item.stackSize > 1 && (
        <div>
          <h6>
            <Trans>STACK SIZE HISTOGRAM</Trans>
          </h6>
          <MarketStackSizeHistogram item={item} data={allSales} />
        </div>
      )}
      <div className="cross_world_markets">
        <div>
          {item.canBeHq && (
            <>
              <h6>
                <img src="/i/game/hq.png" alt="High Quality" height={15} width={15} />{' '}
                {sprintf(t`%s Prices`, 'HQ')} {t`(Includes 5% GST)`}
              </h6>
              <ListingsTable
                listings={hqListings}
                averageHq={hqListingsAveragePpu}
                averageNq={nqListingsAveragePpu}
                crossWorld={true}
                includeDiff={true}
                start={0}
                end={entriesToShow(hqListings)}
              />
              <br />
            </>
          )}
          <h6>
            {sprintf(t`%s Prices`, 'NQ')} {t`(Includes 5% GST)`}
          </h6>
          <ListingsTable
            listings={nqListings}
            averageHq={hqListingsAveragePpu}
            averageNq={nqListingsAveragePpu}
            crossWorld={true}
            includeDiff={true}
            start={0}
            end={entriesToShow(nqListings)}
          />
        </div>
        <div>
          {item.canBeHq && (
            <>
              <h6>
                <img src="/i/game/hq.png" alt="High Quality" height={15} width={15} />{' '}
                {sprintf(t`%s Purchase History`, 'HQ')}
              </h6>
              <SalesTable
                sales={hqSales}
                averageHq={hqSalesAveragePpu}
                averageNq={nqSalesAveragePpu}
                crossWorld={true}
                includeDiff={true}
                start={0}
                end={entriesToShow(hqSales)}
              />
              <br />
            </>
          )}
          <h6>{sprintf(t`%s Purchase History`, 'NQ')}</h6>
          <SalesTable
            sales={nqSales}
            averageHq={hqSalesAveragePpu}
            averageNq={nqSalesAveragePpu}
            crossWorld={true}
            includeDiff={true}
            start={0}
            end={entriesToShow(nqSales)}
          />
        </div>
      </div>
      <br />
      <br />
      <div className="cross_world_markets">
        <div>
          <h6>
            <Trans>Listings</Trans>
          </h6>
          <div className="flex census_box">
            <div>
              <h5>
                <Trans>Avg. Per Unit</Trans>
              </h5>
              <br />
              <div className="flex avg_prices">
                {item.canBeHq && (
                  <div className="flex_50 price-hq">
                    <img src="/i/game/hq.png" alt="High Quality" height={16} width={16} />{' '}
                    {hqListingsAveragePpu.toLocaleString()}
                  </div>
                )}
                <div className={item.canBeHq ? 'flex_50' : 'flex_100'}>
                  {nqListingsAveragePpu.toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <h5>
                <Trans>Avg. Total</Trans>
              </h5>
              <br />
              <div className="flex avg_prices">
                {item.canBeHq && (
                  <div className="flex_50 price-hq">
                    <img src="/i/game/hq.png" alt="High Quality" height={16} width={16} />{' '}
                    {hqListingsAverageTotal.toLocaleString()}
                  </div>
                )}
                <div className={item.canBeHq ? 'flex_50' : 'flex_100'}>
                  {nqListingsAverageTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h6>
            <Trans>Sales</Trans>
          </h6>
          <div className="flex census_box">
            <div>
              <h5>
                <Trans>Avg. Per Unit</Trans>
              </h5>
              <br />
              <div className="flex avg_prices">
                {item.canBeHq && (
                  <div className="flex_50 price-hq">
                    <img src="/i/game/hq.png" alt="High Quality" height={16} width={16} />{' '}
                    {hqSalesAveragePpu.toLocaleString()}
                  </div>
                )}
                <div className={item.canBeHq ? 'flex_50' : 'flex_100'}>
                  {nqSalesAveragePpu.toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <h5>
                <Trans>Avg. Total</Trans>
              </h5>
              <br />
              <div className="flex avg_prices">
                {item.canBeHq && (
                  <div className="flex_50 price-hq">
                    <img src="/i/game/hq.png" alt="High Quality" height={16} width={16} />{' '}
                    {hqSalesAverageTotal.toLocaleString()}
                  </div>
                )}
                <div className={item.canBeHq ? 'flex_50' : 'flex_100'}>
                  {nqSalesAverageTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
