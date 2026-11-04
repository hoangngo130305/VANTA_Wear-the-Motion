import { useStore } from '../context/StoreContext.jsx';

export default function Toast() {
  const { toast } = useStore();
  return <div className={'toast' + (toast.show ? ' show' : '')} role="status" aria-live="polite">{toast.content}</div>;
}
