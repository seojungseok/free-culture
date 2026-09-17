import SearchResults from './SearchResults';
export {metadata} from './SearchResults';

// Only actual search requests need server-side filtering.
export default function Page(){return <SearchResults/>;}
