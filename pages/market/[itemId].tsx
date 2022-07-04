import { Trans } from '@lingui/macro';
import { GetServerSidePropsContext, NextPage } from 'next';
import { getServerSession } from 'next-auth';
import Head from 'next/head';
import { useReducer, useState } from 'react';
import { acquireConn, releaseConn } from '../../db/connect';
import {
  createUserList,
  getUserListCustom,
  getUserLists,
  RecentlyViewedList,
  updateUserListItems,
  USER_LIST_MAX_ITEMS,
} from '../../db/user-list';
import useSettings from '../../hooks/useSettings';
import { DataCenter } from '../../types/game/DataCenter';
import { UserList, UserListCustomType } from '../../types/universalis/user';
import { authOptions } from '../api/auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';
import { DoctrineArray } from '../../db/DoctrineArray';
import { ListsDispatchAction } from '../../components/Market/MarketNav/MarketNav';
import MarketDataCenter from '../../components/Market/MarketDataCenter/MarketDataCenter';
import MarketWorld from '../../components/Market/MarketWorld/MarketWorld';
import MarketServerSelector from '../../components/Market/MarketServerSelector/MarketServerSelector';
import MarketItemHeader from '../../components/Market/MarketItemHeader/MarketItemHeader';
import { getItem } from '../../data/game';
import { Cookies } from 'react-cookie';
import { World } from '../../types/game/World';
import { getServers } from '../../util/servers';

interface MarketProps {
  hasSession: boolean;
  lists: UserList[];
  markets: Record<number, any>;
  itemId: number;
  dc: DataCenter;
  queryServer: string | null;
}

const Market: NextPage<MarketProps> = ({ hasSession, lists, markets, itemId, dc, queryServer }) => {
  const [settings] = useSettings();

  const lang = settings['mogboard_language'] ?? 'en';
  const showHomeWorld = settings['mogboard_homeworld'] === 'yes';
  const homeWorld = settings['mogboard_server'] ?? 'Phoenix';
  const [selectedWorld, setSelectedWorld] = useState<World | undefined>(
    dc.worlds.find((world) => world.name === queryServer ?? (showHomeWorld ? homeWorld : null))
  );

  const [stateLists, dispatch] = useReducer((state: UserList[], action: ListsDispatchAction) => {
    switch (action.type) {
      case 'createList':
        if (!state.find((list) => list.id === action.list.id)) {
          state.push(action.list);
        }
        return state;
      case 'addItem':
        const targetAdd = state.find((list) => list.id === action.listId);
        if (targetAdd != null && !targetAdd.items.includes(action.itemId)) {
          targetAdd.items.push(action.itemId);
        }
        return state;
      case 'removeItem':
        const targetRemove = state.find((list) => list.id === action.listId);
        if (targetRemove != null && targetRemove.items.includes(action.itemId)) {
          targetRemove.items.splice(targetRemove.items.indexOf(action.itemId), 1);
        }
        return state;
    }
  }, lists);

  const item = getItem(itemId, lang)!;

  const title = `${item.name ?? ''} - Universalis`;
  const description =
    'Final Fantasy XIV Online: Market Board aggregator. Find Prices, track Item History and create Price Alerts. Anywhere, anytime.';

  const MarketHead = () => (
    <Head>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="description" content={description} />
      <title>{title}</title>
    </Head>
  );

  if (!item) {
    return <MarketHead />;
  }

  return (
    <>
      <MarketHead />
      <div className="product">
        <div>
          <div className="item_top">
            <MarketItemHeader
              hasSession={hasSession}
              item={item}
              stateLists={stateLists}
              dispatch={dispatch}
            />
            <div className="item_nav_mobile_toggle">
              <button type="button">
                <Trans>Menu</Trans>
              </button>
            </div>
            <div className="item_nav">
              <MarketServerSelector
                dc={dc}
                selectedWorld={selectedWorld}
                setSelectedWorld={setSelectedWorld}
              />
            </div>
          </div>
          <div className="tab">
            <div className={`tab-page tab-summary ${selectedWorld == null ? 'open' : ''}`}>
              <MarketDataCenter item={item} dc={dc} markets={markets} />
            </div>
            {selectedWorld && (
              <div className="tab-page tab-cw open">
                <MarketWorld item={item} world={selectedWorld} market={markets[selectedWorld.id]} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { itemId } = ctx.query;
  if (typeof itemId !== 'string') {
    return { notFound: true };
  }

  let itemIdNumber = parseInt(itemId);
  if (isNaN(itemIdNumber) || !getItem(itemIdNumber, 'en')) {
    return { notFound: true };
  }

  const session = await getServerSession(ctx, authOptions);
  const hasSession = !!session;

  const cookies = new Cookies(ctx.req.headers.cookie);

  let dcs: DataCenter[] = [];
  try {
    const servers = await getServers();
    dcs = servers.dcs.map((dc) => ({
      name: dc.name,
      worlds: dc.worlds.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  } catch (err) {
    console.error(err);
  }

  let lists: UserList[] = [];
  if (session && session.user.id) {
    const conn = await acquireConn();
    try {
      await Promise.all([
        (async () => {
          // Add this item to the user's recently-viewed list, creating it if it doesn't exist.
          const recents = await getUserListCustom(
            session.user.id!,
            UserListCustomType.RecentlyViewed,
            conn
          );

          if (recents) {
            const items = new DoctrineArray();
            items.push(...recents.items.filter((item) => item !== itemIdNumber));
            items.unshift(itemIdNumber);
            while (items.length > USER_LIST_MAX_ITEMS) {
              items.pop();
            }

            await updateUserListItems(session.user.id!, recents.id, items, conn);
          } else {
            const items = new DoctrineArray();
            items.push(itemIdNumber);
            await createUserList(RecentlyViewedList(uuidv4(), session.user.id!, items), conn);
          }
        })(),
        (async () => {
          lists = await getUserLists(session.user.id!, conn);
        })(),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      await releaseConn(conn);
    }
  }

  const queryServer =
    typeof ctx.query.server === 'string' && ctx.query.server.length > 0 ? ctx.query.server : null;
  const homeWorld = cookies.get<string | undefined>('mogboard_server') ?? 'Phoenix';
  const dc = dcs.find(
    (x) =>
      x.worlds.some((y) => y.name.toLowerCase() === (queryServer ?? homeWorld).toLowerCase()) ||
      (queryServer && x.name.toLowerCase() === queryServer.toLowerCase())
  );
  if (!dc) {
    throw new Error('Data center not found.');
  }

  const markets: Record<number, any> = {};
  const marketFetches: Promise<void>[] = [];
  for (const world of dc.worlds) {
    marketFetches.push(
      (async () => {
        const market = await fetch(`https://universalis.app/api/v2/${world.id}/${itemIdNumber}`)
          .then((res) => res.json())
          .catch(console.error);
        markets[world.id] = market;
      })()
    );
  }

  await Promise.all(marketFetches);

  return {
    props: { hasSession, lists, markets, itemId: itemIdNumber, dc, queryServer },
  };
}

export default Market;
