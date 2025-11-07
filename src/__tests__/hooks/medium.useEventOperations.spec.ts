import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerListCreation,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event, EventForm } from '../../types.ts';

const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
    }),
  };
});

beforeEach(() => {
  enqueueSnackbarFn.mockClear();
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newEvent = {
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});

it('반복 일정 생성 성공 시 이벤트가 재로딩되고 성공 토스트가 노출된다', async () => {
  setupMockHandlerListCreation();

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));
  enqueueSnackbarFn.mockClear();

  const repeatEvent: EventForm = {
    title: '반복 회의',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '10:00',
    description: '반복 일정 생성',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.createRepeatEvent(repeatEvent);
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toHaveLength(2);
  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정이 추가되었습니다', {
    variant: 'success',
  });
});

it("반복 일정 생성 실패 시 '일정 저장 실패' 토스트가 노출된다", async () => {
  server.use(
    http.get('/api/events', () => HttpResponse.json({ events: [] })),
    http.post('/api/events-list', () => new HttpResponse(null, { status: 500 }))
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));
  enqueueSnackbarFn.mockClear();

  const repeatEvent: EventForm = {
    title: '실패하는 반복 회의',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '10:00',
    description: '반복 일정 실패',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.createRepeatEvent(repeatEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });
  expect(result.current.events).toHaveLength(0);
});

it('성공 저장이라도 showSuccessMessage 옵션이 false면 성공 토스트를 생략한다', async () => {
  setupMockHandlerCreation();

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));
  enqueueSnackbarFn.mockClear();

  const newEvent = {
    title: '토스트 미표시 이벤트',
    date: '2025-10-18',
    startTime: '11:00',
    endTime: '12:00',
    description: '토스트 생략',
    location: '회의실 C',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent, { showSuccessMessage: false });
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
  expect(enqueueSnackbarFn).not.toHaveBeenCalledWith('일정이 추가되었습니다', {
    variant: 'success',
  });
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2025-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999', // 존재하지 않는 ID
    title: '존재하지 않는 이벤트',
    date: '2025-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

  expect(result.current.events).toHaveLength(1);
});
