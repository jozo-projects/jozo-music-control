type PrizeItem = { name: string; quantity: number; imageUrl?: string };

export function QuizPrizeImages({ items, large = false }: { items?: PrizeItem[]; large?: boolean }) {
  const images = (items ?? []).filter(item => {
    if (!item.imageUrl) return false;
    try {
      const url = new URL(item.imageUrl);
      return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && !url.username && !url.password && !url.search && !url.hash && url.pathname.includes('/image/upload/');
    } catch { return false; }
  });
  if (!images.length) return null;
  return <div className="mt-3 flex flex-wrap justify-center gap-3">{images.map((item, index) => <img key={`${item.imageUrl}-${index}`} src={item.imageUrl} alt={item.name} referrerPolicy="no-referrer" onError={event => { event.currentTarget.hidden = true; }} className={large ? 'h-40 w-40 rounded-2xl bg-white object-contain p-2 shadow-md sm:h-52 sm:w-52' : 'h-20 w-20 rounded-xl bg-white object-cover shadow-sm'} />)}</div>;
}
