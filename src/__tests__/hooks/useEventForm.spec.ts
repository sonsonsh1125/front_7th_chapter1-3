import { act, renderHook } from '@testing-library/react';
import { ChangeEvent } from 'react';

import { useEventForm } from '../../hooks/useEventForm.ts';
import { Event } from '../../types.ts';

const createChangeEvent = (value: string) =>
  ({ target: { value } } as unknown as ChangeEvent<HTMLInputElement>);

describe('useEventForm', () => {
  it('시간 변경 시 검증 에러 메시지를 즉시 반영한다', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setEndTime('11:00');
    });

    act(() => {
      result.current.handleStartTimeChange(createChangeEvent('10:00'));
    });

    expect(result.current.startTime).toBe('10:00');
    expect(result.current.startTimeError).toBeNull();
    expect(result.current.endTimeError).toBeNull();

    act(() => {
      result.current.handleStartTimeChange(createChangeEvent('09:30'));
    });

    expect(result.current.startTimeError).toBeNull();
    expect(result.current.endTimeError).toBeNull();

    act(() => {
      result.current.handleEndTimeChange(createChangeEvent('09:00'));
    });

    expect(result.current.endTime).toBe('09:00');
    expect(result.current.startTimeError).toBe(
      '시작 시간은 종료 시간보다 빨라야 합니다.'
    );
    expect(result.current.endTimeError).toBe(
      '종료 시간은 시작 시간보다 늦어야 합니다.'
    );
  });

  it('resetForm 호출 시 모든 필드를 기본값으로 되돌린다', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setTitle('회의');
      result.current.setDate('2025-10-15');
      result.current.setStartTime('09:00');
      result.current.setEndTime('10:00');
      result.current.setDescription('설명');
      result.current.setLocation('회의실');
      result.current.setCategory('개인');
      result.current.setIsRepeating(true);
      result.current.setRepeatType('weekly');
      result.current.setRepeatInterval(2);
      result.current.setRepeatEndDate('2025-12-31');
      result.current.setNotificationTime(60);
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.title).toBe('');
    expect(result.current.date).toBe('');
    expect(result.current.startTime).toBe('');
    expect(result.current.endTime).toBe('');
    expect(result.current.description).toBe('');
    expect(result.current.location).toBe('');
    expect(result.current.category).toBe('업무');
    expect(result.current.isRepeating).toBe(false);
    expect(result.current.repeatType).toBe('none');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('');
    expect(result.current.notificationTime).toBe(10);
  });

  it('editEvent 호출 시 이벤트 정보를 폼 상태에 주입한다', () => {
    const initialEvent: Event = {
      id: 'event-1',
      title: '수정 대상 회의',
      date: '2025-11-01',
      startTime: '13:00',
      endTime: '14:00',
      description: '수정 테스트',
      location: '본사',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2026-01-01' },
      notificationTime: 120,
    };

    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.editEvent(initialEvent);
    });

    expect(result.current.editingEvent).toEqual(initialEvent);
    expect(result.current.title).toBe('수정 대상 회의');
    expect(result.current.date).toBe('2025-11-01');
    expect(result.current.startTime).toBe('13:00');
    expect(result.current.endTime).toBe('14:00');
    expect(result.current.description).toBe('수정 테스트');
    expect(result.current.location).toBe('본사');
    expect(result.current.category).toBe('업무');
    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('monthly');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('2026-01-01');
    expect(result.current.notificationTime).toBe(120);
  });
});

