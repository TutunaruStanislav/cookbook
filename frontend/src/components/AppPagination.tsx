import { Pagination } from 'react-bootstrap';

interface Props {
  count: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function AppPagination({ count, page, pageSize, onChange }: Props) {
  const total = Math.ceil(count / pageSize);
  if (total <= 1) return null;

  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < total - 2) pages.push('...');
    pages.push(total);
  }

  return (
    <Pagination className="justify-content-center mt-4 mb-2">
      <Pagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
      {pages.map((p, i) =>
        p === '...' ? (
          <Pagination.Ellipsis key={`e${i}`} disabled />
        ) : (
          <Pagination.Item key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </Pagination.Item>
        ),
      )}
      <Pagination.Next disabled={page === total} onClick={() => onChange(page + 1)} />
    </Pagination>
  );
}
