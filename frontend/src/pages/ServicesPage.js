import { Services } from '../components/Services';

export function ServicesPage({ onQuoteClick }) {
  return (
    <div className="pt-0">
      <Services onQuoteClick={onQuoteClick} />
    </div>
  );
}
