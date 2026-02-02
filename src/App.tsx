/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import { createTodos, getTodos, patchTodo } from './api/todos';
import { Todo } from './types/Todo';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import { FilterStatus } from './types/FilterStatus';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { TodoList } from './components/TodoList/TodoList';
import { TodoItem } from './components/TodoItem/TodoItem';
import { deleteTodo } from './api/todos';
import { ErrorMessage } from './types/ErrorMessage';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState<FilterStatus>(FilterStatus.All);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  const headerRef = useRef<HTMLInputElement>(null);

  const handleShowError = (error: string) => {
    setErrorMessage(error);
  };

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timerId = setTimeout(() => {
      setErrorMessage(ErrorMessage.DefaultValue);
    }, 3000);

    return () => clearTimeout(timerId);
  }, [errorMessage]);

  const handleToggleTodos = (status: boolean) => {
    const allUpdateTodos = todos.filter(todo => todo.completed === !status);

    const neededUpdateIds = allUpdateTodos.map(todo => todo.id);

    setProcessingIds(prev => [...prev, ...neededUpdateIds]);

    const promises = allUpdateTodos.map(todo => {
      return patchTodo(todo.id, { ...todo, completed: status })
        .then(responseTodo => {
          setTodos(currentTodos =>
            currentTodos.map(t =>
              t.id === responseTodo.id ? responseTodo : t,
            ),
          );

          return true;
        })
        .catch(() => {
          return false;
        })
        .finally(() => {
          setProcessingIds(prev =>
            prev.filter(processingId => processingId !== todo.id),
          );
        });
    });

    Promise.all(promises).then(results => {
      if (results.includes(false)) {
        handleShowError(ErrorMessage.UpdateMessage);
      }
    });
  };

  const handleDeleteCompleteAll = () => {
    const filteredCompleted = todos.filter(
      element => element.completed === true,
    );

    const filteredCompletedIds = filteredCompleted.map(e => e.id);

    setProcessingIds(prev => [...prev, ...filteredCompletedIds]);

    const promises: Promise<boolean>[] = filteredCompletedIds.map(id => {
      return deleteTodo(id)
        .then(() => {
          setTodos(currentTodo => currentTodo.filter(todo => todo.id !== id));

          return true;
        })
        .catch(() => {
          return false;
        })
        .finally(() => {
          setProcessingIds(prev => prev.filter(currentId => currentId !== id));
        });
    });

    Promise.all(promises).then(results => {
      if (results.some(element => element === false)) {
        handleShowError(ErrorMessage.DeleteMessage);
      }

      headerRef.current?.focus();
    });
  };

  const handleDeleteTodo = (id: number) => {
    setProcessingIds(prev => [...prev, id]);

    deleteTodo(id)
      .then(() => {
        setTodos(currentTodo => currentTodo.filter(todo => todo.id !== id));
        headerRef.current?.focus();
      })
      .catch(() => {
        handleShowError(ErrorMessage.DeleteMessage);
      })
      .finally(() => {
        setProcessingIds(prev => prev.filter(currentId => currentId !== id));
      });
  };

  const handleUpdateTodo = (id: number, data: Todo) => {
    setProcessingIds(prev => [...prev, id]);

    return patchTodo(id, data)
      .then(updatedTodo => {
        setTodos(currentTodo =>
          currentTodo.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo,
          ),
        );
      })
      .catch(() => {
        handleShowError(ErrorMessage.UpdateMessage);

        return Promise.reject();
      })
      .finally(() => {
        setProcessingIds(prev => prev.filter(currentId => currentId !== id));
      });
  };

  const handleCreateTodo = (title: string): Promise<void> => {
    const trimTitle = title.trim();

    if (trimTitle.length === 0) {
      handleShowError(ErrorMessage.TitleEmpty);

      return Promise.reject();
    }

    if (headerRef.current) {
      headerRef.current.disabled = true;
    }

    const todo: Todo = {
      id: 0,
      userId: USER_ID,
      title: trimTitle,
      completed: false,
    };

    setTempTodo(todo);

    return createTodos(trimTitle)
      .then(newTodo => {
        setTodos(currentTodo => {
          return [...currentTodo, newTodo];
        });
      })
      .catch(() => {
        handleShowError(ErrorMessage.AddMessage);
        throw new Error();
      })
      .finally(() => {
        setTempTodo(null);
        if (headerRef.current) {
          headerRef.current.disabled = false;
          headerRef.current.focus();
        }
      });
  };

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage(ErrorMessage.LoadMessage);
      });
  }, []);

  const visibleTodos = todos.filter(todo => {
    switch (filter) {
      case FilterStatus.Active:
        return !todo.completed;

      case FilterStatus.Completed:
        return todo.completed;

      default:
        return true;
    }
  });

  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  const completedTodos = todos.filter(todo => todo.completed).length;

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          onCreateTodo={handleCreateTodo}
          ref={headerRef}
          todosCountInfo={[todos.length, activeTodosCount]}
          onToggleTodos={handleToggleTodos}
        />
        {todos.length > 0 && (
          <TodoList
            visibleTodos={visibleTodos}
            onDelete={handleDeleteTodo}
            processingIds={processingIds}
            onPatch={handleUpdateTodo}
          />
        )}
        {tempTodo && (
          <TodoItem
            todo={tempTodo}
            onDelete={handleDeleteTodo}
            isLoading={true}
            onPatch={handleUpdateTodo}
          />
        )}
        {todos.length > 0 && (
          <Footer
            activeTodosCount={activeTodosCount}
            filter={filter}
            onFilterChange={setFilter}
            onDeleteCompleteAll={handleDeleteCompleteAll}
            completedTodos={completedTodos}
          />
        )}
        {/* Hide the footer if there are no todos */}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage(ErrorMessage.DefaultValue)}
        />
        {/* show only one message at a time */}
        {errorMessage}
      </div>
    </div>
  );
};
