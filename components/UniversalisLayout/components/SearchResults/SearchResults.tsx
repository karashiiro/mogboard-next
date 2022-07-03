import { Trans } from '@lingui/macro';
import Image from 'next/image';
import Link from 'next/link';
import SimpleBar from 'simplebar-react';
import { SearchItem } from '../../../../data/game/search';
import useClickOutside from '../../../../hooks/useClickOutside';

interface SearchResultsProps {
  isOpen: boolean;
  closeResults: () => void;
  results: SearchItem[];
  totalResults: number;
  searchTerm: string;
}

export default function SearchResults({
  isOpen,
  results,
  totalResults,
  searchTerm,
  closeResults,
}: SearchResultsProps) {
  const resultsRef = useClickOutside<HTMLDivElement>(null, closeResults);

  return (
    <div ref={resultsRef} className={`search-results-container ${isOpen ? 'open' : ''}`}>
      <div className="search-results">
        <div className="item-search-header">
          <div>
            <Trans>
              Found {results.length} / {totalResults} for <strong>{searchTerm}</strong>
            </Trans>
          </div>
          <div></div>
        </div>
        <SimpleBar className="item-search-list" id="item-search-list" style={{ height: '73vh' }}>
          {results.map((item) => (
            <Link key={item.id} href="/market/[itemId]" as={`/market/${item.id}`}>
              <a className={`rarity-${item.rarity}`} onClick={closeResults}>
                <span className="item-icon">
                  <Image src={item.icon} alt="" width={40} height={40} />
                </span>
                <span className="item-level">{item.levelItem}</span>
                {item.name}
                <span className="item-category">{item.itemSearchCategory.name}</span>
              </a>
            </Link>
          ))}
        </SimpleBar>
      </div>
    </div>
  );
}
