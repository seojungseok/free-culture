import type {TicketArticle} from '@/lib/tickets';
import TicketLinks from './TicketLinks';

// Both editorial generations share the original inline booking design.
export default function TicketBooking({article}:{article:TicketArticle}) {
  return <TicketLinks article={article}/>;
}
