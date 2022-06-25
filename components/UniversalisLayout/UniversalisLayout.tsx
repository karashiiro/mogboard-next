import { PropsWithChildren, useState } from 'react';
import useSettings from '../../hooks/useSettings';
import { CategoryItem } from '../../types/game/CategoryItem';
import { Item } from '../../types/game/Item';
import { ItemSearchCategory } from '../../types/game/ItemSearchCategory';
import CategoryView from './components/CategoryView/CategoryView';
import ModalCover from './components/ModalCover/ModalCover';
import Popup, { usePopup } from './components/Popup/Popup';
import SearchCategories from './components/SearchCategories/SearchCategories';
import SearchCategoryResults from './components/SearchCategoryResults/SearchCategoryResults';
import SearchResults from './components/SearchResults/SearchResults';
import SettingsModal from './components/SettingsModal/SettingsModal';
import UniversalisFooter from './components/UniversalisFooter/UniversalisFooter';
import UniversalisHeader from './components/UniversalisHeader/UniversalisHeader';
import UniversalisLeftNav from './components/UniversalisLeftNav/UniversalisLeftNav';

export default function UniversalisLayout({ children }: PropsWithChildren) {
  const [settings] = useSettings();

  const [navCategoryItemsOpen, setNavCategoryItemsOpen] = useState(false);
  const [navCategoryItems, setNavCategoryItems] = useState<CategoryItem[]>([]);

  const [settingsModalOpen, setSettingsModalOpen] = useState(settings['mogboard_server'] == null);

  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [searchCategoriesOpen, setSearchCategoriesOpen] = useState(false);
  const [searchCategoryResultsOpen, setSearchCategoryResultsOpen] = useState(false);
  const [searchCategoryItems, setSearchCategoryItems] = useState<CategoryItem[]>([]);
  const [searchCategory, setSearchCategory] = useState<ItemSearchCategory | undefined>(undefined);

  const { popup, setPopup } = usePopup();

  const anyModalOpen = settingsModalOpen;

  const leftNav = settings['mogboard_leftnav'] === 'on';
  return (
    <div className="site-container">
      {leftNav && (
        <UniversalisLeftNav
          onCategoryOpen={(cat) => {
            setNavCategoryItems(cat);
            setNavCategoryItemsOpen(true);
          }}
        />
      )}
      <div className={`site left-nav-${leftNav ? 'on' : 'off'}`}>
        <UniversalisHeader
          onResults={(results, totalResults, query) => {
            setSearchResults(results);
            setSearchTotal(totalResults);
            setSearchTerm(query);
            setSearchResultsOpen(true);
          }}
          onSettingsClicked={() => setSettingsModalOpen(true)}
          onMarketClicked={() => setSearchCategoriesOpen(true)}
        />
        <nav className="site-menu"></nav>
        <CategoryView
          isOpen={navCategoryItemsOpen}
          closeView={() => setNavCategoryItemsOpen(false)}
          items={navCategoryItems}
        />

        <main>{children}</main>

        <UniversalisFooter />

        <SearchResults
          isOpen={searchResultsOpen}
          closeResults={() => setSearchResultsOpen(false)}
          results={searchResults}
          totalResults={searchTotal}
          searchTerm={searchTerm}
        />
        <SearchCategories
          isOpen={searchCategoriesOpen}
          closeBox={() => setSearchCategoriesOpen(false)}
          onCategoryOpen={(cat, catItems) => {
            setSearchCategoriesOpen(false);
            setSearchCategory(cat);
            setSearchCategoryItems(catItems);
            setSearchCategoryResultsOpen(true);
          }}
        />
        <SearchCategoryResults
          isOpen={searchCategoryResultsOpen}
          closeResults={() => setSearchCategoryResultsOpen(false)}
          items={searchCategoryItems}
          category={searchCategory}
        />
      </div>

      {settingsModalOpen && (
        <SettingsModal
          isOpen={settingsModalOpen}
          closeModal={() => setSettingsModalOpen(false)}
          onSave={() => {
            setPopup({
              type: 'success',
              title: 'Settings Saved',
              message: 'Refreshing site, please wait...',
              forceOpen: true,
              isOpen: true,
            });
            location.reload();
          }}
        />
      )}
      <ModalCover isOpen={anyModalOpen} />
      <Popup {...popup} onClose={() => setPopup({ isOpen: false })} />
    </div>
  );
}
