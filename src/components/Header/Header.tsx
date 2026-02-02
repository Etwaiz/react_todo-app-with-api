import classNames from 'classnames';
import { useState, forwardRef } from 'react';

type Props = {
  onCreateTodo: (value: string) => Promise<void>;
  onToggleTodos: (completed: boolean) => void;
  todosCountInfo: number[];
};

export const Header = forwardRef<HTMLInputElement, Props>(function Header(
  {
    onToggleTodos,
    todosCountInfo: [allTodosCount, activeTodosCount],
    onCreateTodo,
  },
  ref,
) {
  const [title, setTitle] = useState('');

  const isAllCompleted = activeTodosCount === 0;

  const handleOnSubmitForm = (event: React.FormEvent) => {
    event.preventDefault();

    onCreateTodo(title)
      .then(() => {
        setTitle('');
      })
      .catch(() => {});
  };

  const handleToggleTodos = () => {
    onToggleTodos(!isAllCompleted);
  };

  return (
    <header className="todoapp__header">
      {/* this button should have `active` class only if all todos are completed */}
      {allTodosCount > 0 && (
        <button
          type="button"
          className={classNames('todoapp__toggle-all', {
            active: isAllCompleted,
          })}
          data-cy="ToggleAllButton"
          onClick={handleToggleTodos}
        />
      )}

      {/* Add a todo on form submit */}
      <form onSubmit={handleOnSubmitForm}>
        <input
          ref={ref}
          value={title}
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          onChange={event => setTitle(event.target.value)}
          autoFocus
        />
      </form>
    </header>
  );
});
