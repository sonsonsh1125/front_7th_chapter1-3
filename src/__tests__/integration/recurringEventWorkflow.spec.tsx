import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';

import {
  setupMockHandlerRecurringListDelete,
  setupMockHandlerRecurringListUpdate,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils';
import App from '../../App';

const theme = createTheme();

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

const createMockDataTransfer = () => {
  const data: Record<string, string> = {};
  return {
    dropEffect: 'move',
    effectAllowed: 'all',
    files: [],
    items: [],
    types: [],
    setData: (type: string, value: string) => {
      data[type] = value;
    },
    getData: (type: string) => data[type] ?? '',
    clearData: () => {
      Object.keys(data).forEach((key) => delete data[key]);
    },
    setDragImage: () => undefined,
  } as unknown as DataTransfer;
};

describe('반복 일정 워크플로우 통합 테스트', () => {
  it('반복 일정을 생성하고 편집 다이얼로그가 나타나는지 확인한다', async () => {
    setupMockHandlerUpdating([
      {
        id: '1',
        title: '매일 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '매일 진행되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
        notificationTime: 1,
      },
      {
        id: '2',
        title: '매일 회의',
        date: '2025-10-16',
        startTime: '14:00',
        endTime: '15:00',
        description: '매일 진행되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
        notificationTime: 1,
      },
    ]);

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // 생성된 반복 일정 확인
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getAllByText('매일 회의')).toHaveLength(2);

    // 첫 번째 반복 일정 편집 시도
    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[0]);

    // 반복 일정 편집 다이얼로그가 나타나는지 확인
    expect(screen.getByText('반복 일정 수정')).toBeInTheDocument();
    expect(screen.getByText('해당 일정만 수정하시겠어요?')).toBeInTheDocument();
  });

  it('예를 선택하면 해당 일정만 단일 일정으로 변경된다', async () => {
    setupMockHandlerUpdating([
      {
        id: '1',
        title: '매일 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '매일 진행되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
        notificationTime: 1,
      },
      {
        id: '2',
        title: '매일 회의',
        date: '2025-10-16',
        startTime: '14:00',
        endTime: '15:00',
        description: '매일 진행되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
        notificationTime: 1,
      },
    ]);

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // 반복 일정이 생성되었는지 확인 (반복 아이콘이 있는지 확인)
    await screen.findByTestId('event-list');
    const repeatIcons = screen.getAllByTestId('RepeatIcon');
    expect(repeatIcons.length).toBeGreaterThan(0);

    // 첫 번째 반복 일정 편집
    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[0]);

    await screen.findByText('해당 일정만 수정하시겠어요?', {}, { timeout: 3000 });
    const yesButton = await screen.findByText('예');
    await user.click(yesButton);

    // 일정 편집 폼에서 제목 변경
    const titleInput = screen.getByLabelText('제목');
    await user.click(titleInput);
    await user.keyboard('{Control>}a{/Control}');
    await user.keyboard('{delete}');
    await user.type(titleInput, '수정된 회의');
    await user.click(screen.getByTestId('event-submit-button'));

    // 결과 확인: 한 개는 수정되고 나머지는 그대로
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
  });

  it('아니오를 선택하면 모든 반복 일정이 변경된다', async () => {
    setupMockHandlerRecurringListUpdate([
      {
        id: '1',
        title: '매일 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '매일 진행되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
        notificationTime: 1,
      },
      {
        id: '2',
        title: '매일 회의',
        date: '2025-10-16',
        startTime: '14:00',
        endTime: '15:00',
        description: '매일 진행되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
        notificationTime: 1,
      },
    ]);

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // 첫 번째 반복 일정 편집
    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[0]);

    // 다이얼로그가 나타나는지 확인
    await screen.findByText('해당 일정만 수정하시겠어요?', {}, { timeout: 3000 });

    const noButton = await screen.findByText('아니오');
    await user.click(noButton);

    // 일정 편집 폼에서 제목 변경
    const titleInput = screen.getByLabelText('제목');
    await user.click(titleInput);
    await user.keyboard('{Control>}a{/Control}');
    await user.keyboard('{delete}');
    await user.type(titleInput, '전체 변경된 회의');
    await user.click(screen.getByTestId('event-submit-button'));

    // 결과 확인: 최소한 변경된 이벤트가 존재해야 함
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getAllByText('전체 변경된 회의')).toHaveLength(2);
  });

  describe('드래그 앤 드롭 상호작용', () => {
    it('비반복 일정을 드래그하여 다른 날짜로 이동하면 새로운 날짜가 저장된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '드래그 일정',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '드래그 테스트',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = await screen.findByTestId('month-view');

      const sourceCell = within(monthView)
        .getAllByRole('cell')
        .find((cell) => within(cell).queryByText('15') && within(cell).queryByText('드래그 일정'));
      expect(sourceCell).toBeDefined();

      const draggableEvent = within(sourceCell as HTMLElement)
        .getByText('드래그 일정')
        .closest('[draggable="true"]');
      expect(draggableEvent).not.toBeNull();

      const targetCell = within(monthView)
        .getAllByRole('cell')
        .find((cell) => within(cell).queryByText('16'));
      expect(targetCell).toBeDefined();

      const dataTransfer = createMockDataTransfer();
      fireEvent.dragStart(draggableEvent as Element, { dataTransfer });
      fireEvent.dragEnter(targetCell as Element, { dataTransfer });
      fireEvent.dragOver(targetCell as Element, { dataTransfer });
      fireEvent.drop(targetCell as Element, { dataTransfer });

      await waitFor(() => {
        const movedEvent = within(targetCell as HTMLElement).queryByText('드래그 일정');
        expect(movedEvent).toBeInTheDocument();
      });

      await waitFor(() => {
        const originalEvent = within(sourceCell as HTMLElement).queryByText('드래그 일정');
        expect(originalEvent).not.toBeInTheDocument();
      });
    });

    it('반복 일정을 드래그 후 단일 이동을 선택하면 해당 인스턴스만 이동된다', async () => {
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '반복 일정',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정 이동 테스트',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-18' },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 일정',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '반복 일정 이동 테스트',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-18' },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const monthView = await screen.findByTestId('month-view');

      const sourceCell = within(monthView)
        .getAllByRole('cell')
        .find((cell) => within(cell).queryByText('15') && within(cell).queryByText('반복 일정'));
      expect(sourceCell).toBeDefined();

      const draggableEvent = within(sourceCell as HTMLElement)
        .getByText('반복 일정')
        .closest('[draggable="true"]');
      expect(draggableEvent).not.toBeNull();

      const targetCell = within(monthView)
        .getAllByRole('cell')
        .find((cell) => within(cell).queryByText('17'));
      expect(targetCell).toBeDefined();

      const dataTransfer = createMockDataTransfer();
      fireEvent.dragStart(draggableEvent as Element, { dataTransfer });
      fireEvent.dragEnter(targetCell as Element, { dataTransfer });
      fireEvent.dragOver(targetCell as Element, { dataTransfer });
      fireEvent.drop(targetCell as Element, { dataTransfer });

      expect(await screen.findByText('반복 일정 이동')).toBeInTheDocument();
      expect(screen.getByText('해당 일정만 이동하시겠어요?')).toBeInTheDocument();

      await user.click(screen.getByText('예'));
      await screen.findByText('일정이 이동되었습니다');

      await waitFor(() => {
        const movedEvent = within(targetCell as HTMLElement).queryByText('반복 일정');
        expect(movedEvent).toBeInTheDocument();
      });

      await waitFor(() => {
        const originalEvent = within(sourceCell as HTMLElement).queryByText('반복 일정');
        expect(originalEvent).not.toBeInTheDocument();
      });
    });
  });

  describe('반복 일정 삭제 워크플로우 (P2 테스트)', () => {
    it('반복 일정 삭제 시 삭제 다이얼로그가 나타난다', async () => {
      setupMockHandlerRecurringListDelete([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
        {
          id: '2',
          title: '매일 회의',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 생성된 반복 일정 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getAllByText('매일 회의')).toHaveLength(2);

      // 첫 번째 반복 일정 삭제 시도
      const deleteButtons = await screen.findAllByLabelText('Delete event');
      await user.click(deleteButtons[0]);

      // 반복 일정 삭제 다이얼로그가 나타나는지 확인
      expect(screen.getByText('반복 일정 삭제')).toBeInTheDocument();
      expect(screen.getByText('해당 일정만 삭제하시겠어요?')).toBeInTheDocument();
    });

    it('삭제 다이얼로그에서 예를 선택하면 해당 일정만 삭제된다', async () => {
      setupMockHandlerRecurringListDelete([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
        {
          id: '2',
          title: '매일 회의',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 반복 일정이 생성되었는지 확인
      await screen.findByTestId('event-list');
      const eventList = within(screen.getByTestId('event-list'));
      const initialEvents = eventList.getAllByText('매일 회의');
      expect(initialEvents).toHaveLength(2);

      // 첫 번째 반복 일정 삭제
      const deleteButtons = await screen.findAllByLabelText('Delete event');
      await user.click(deleteButtons[0]);

      await screen.findByText('해당 일정만 삭제하시겠어요?', {}, { timeout: 3000 });

      // "예" 버튼 선택 (단일 삭제)
      const yesButton = await screen.findByText('예');
      await user.click(yesButton);
      await screen.findByText('일정이 삭제되었습니다');

      const updatedEventList = within(screen.getByTestId('event-list'));
      const remainingEvents = updatedEventList.queryAllByText('매일 회의');
      expect(remainingEvents).toHaveLength(1);
    });

    it('삭제 다이얼로그에서 아니오를 선택하면 모든 반복 일정이 삭제된다', async () => {
      setupMockHandlerRecurringListDelete([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
        {
          id: '2',
          title: '매일 회의',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
      ]);

      const { user } = setup(<App />);

      // 반복 일정이 생성되었는지 확인
      await screen.findByTestId('event-list');
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getAllByText('매일 회의')).toHaveLength(2);

      // 첫 번째 반복 일정 삭제
      const deleteButtons = await screen.findAllByLabelText('Delete event');
      await user.click(deleteButtons[0]);

      await screen.findByText('해당 일정만 삭제하시겠어요?', {}, { timeout: 3000 });

      // "아니오" 버튼 선택 (전체 삭제)
      const noButton = await screen.findByText('아니오');
      await user.click(noButton);

      const updatedEventList = within(screen.getByTestId('event-list'));
      const remainingEvents = updatedEventList.queryAllByText('매일 회의');
      expect(remainingEvents).toHaveLength(0);
    });

    it('삭제 다이얼로그에서 취소를 선택하면 삭제가 취소된다', async () => {
      setupMockHandlerRecurringListDelete([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
        {
          id: '2',
          title: '매일 회의',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
          notificationTime: 1,
        },
      ]);

      const { user } = setup(<App />);

      // 반복 일정이 생성되었는지 확인
      await screen.findByTestId('event-list');
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getAllByText('매일 회의')).toHaveLength(2);

      // 첫 번째 반복 일정 삭제 시도
      const deleteButtons = await screen.findAllByLabelText('Delete event');
      await user.click(deleteButtons[0]);

      await screen.findByText('해당 일정만 삭제하시겠어요?', {}, { timeout: 3000 });

      // 취소 버튼 클릭
      const cancelButton = await screen.findByText('취소');
      await user.click(cancelButton);

      // 다이얼로그가 닫히고 삭제되지 않음을 확인
      expect(screen.queryByText('반복 일정 삭제')).not.toBeInTheDocument();

      // 모든 일정이 그대로 남아있는지 확인
      const unchangedEventList = within(screen.getByTestId('event-list'));
      expect(unchangedEventList.getAllByText('매일 회의')).toHaveLength(2);
    });
  });
});
