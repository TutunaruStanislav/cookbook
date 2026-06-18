import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAddComment, useComments, useDeleteComment } from '../hooks/useSocial';
import AppPagination from './AppPagination';

const PAGE_SIZE = 12;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface Props {
  recipeId: number;
  recipeAuthorId: number;
}

export default function CommentsSection({ recipeId, recipeAuthorId }: Props) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [text, setText] = useState('');

  const { data, isLoading } = useComments(recipeId, page);
  const addComment = useAddComment(recipeId);
  const deleteComment = useDeleteComment(recipeId);

  const canDelete = (authorId: number) =>
    user?.id === authorId || user?.id === recipeAuthorId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment.mutateAsync(text.trim());
    setText('');
    setPage(1);
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Удалить комментарий?')) return;
    await deleteComment.mutateAsync(commentId);
    if (data && data.results.length === 1 && page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <section className="mt-5 pt-4 border-top">
      <h5 className="fw-semibold mb-3">
        Комментарии{data ? ` (${data.count})` : ''}
      </h5>

      {isLoading && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="secondary" />
        </div>
      )}

      {data && data.results.length === 0 && (
        <p className="text-muted small mb-3">Комментариев пока нет. Будьте первым!</p>
      )}

      {data && data.results.map((comment) => {
        const name =
          comment.author.first_name
            ? `${comment.author.first_name} ${comment.author.last_name ?? ''}`.trim()
            : comment.author.username;

        return (
          <div key={comment.id} className="border-bottom py-3">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <strong className="me-2 small">{name}</strong>
                <small className="text-muted">{formatDate(comment.created_at)}</small>
              </div>
              {canDelete(comment.author.id) && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-danger text-decoration-none flex-shrink-0"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleteComment.isPending}
                >
                  Удалить
                </Button>
              )}
            </div>
            <p className="mb-0 mt-2 small">{comment.text}</p>
          </div>
        );
      })}

      {data && data.count > PAGE_SIZE && (
        <AppPagination
          count={data.count}
          page={page}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      )}

      <div className="mt-4">
        {user ? (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-2">
              <Form.Label className="fw-semibold small">Ваш комментарий</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напишите комментарий..."
                maxLength={1000}
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!text.trim() || addComment.isPending}
            >
              {addComment.isPending ? 'Отправка...' : 'Отправить'}
            </Button>
          </Form>
        ) : (
          <div className="p-3 bg-light rounded text-center">
            <small className="text-muted">
              <Link to="/login">Войдите</Link>, чтобы оставить комментарий.
            </small>
          </div>
        )}
      </div>
    </section>
  );
}
