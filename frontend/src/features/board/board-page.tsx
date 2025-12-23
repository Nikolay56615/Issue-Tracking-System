import { Board } from './ui/board';
import { useParams } from 'react-router';
import { IssueForm } from '@/features/board/ui/issue-form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { FiltersPopover } from '@/features/board/ui/filters-popover.tsx';
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { getBoard } from '@/features/board/model/board.actions.ts';
import { setNameQuery } from '@/features/board/model/board.reducer.ts';

export const BoardPage = () => {
  const params = useParams();
  const projectId = Number(params.projectId);

  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.boardReducer.filters);

  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      dispatch(
        getBoard({
          projectId,
          filters,
        })
      );
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [filters.nameQuery, dispatch, projectId, filters]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-row items-center gap-4 px-8 pt-4">
        <Input
          placeholder="Search issues by name..."
          value={filters.nameQuery || ''}
          onChange={(e) => dispatch(setNameQuery(e.target.value))}
        />
        <FiltersPopover projectId={projectId} />
        <IssueForm mode="add" projectId={projectId} />
      </div>
      <Board projectId={projectId} />
    </div>
  );
};
