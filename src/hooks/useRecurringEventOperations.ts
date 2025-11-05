/* global RequestInit */

import { Event } from '../types';

/**
 * API endpoints for recurring event operations
 */
const API_ENDPOINTS = {
  events: '/api/events',
  recurringEvents: '/api/recurring-events',
} as const;

/**
 * HTTP method constants
 */
const HTTP_METHODS = {
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

/**
 * Default event repeat configuration for non-recurring events
 */
const DEFAULT_REPEAT_CONFIG = {
  type: 'none' as const,
  interval: 0,
};

/**
 * Custom hook for managing recurring event operations
 * Provides functionality for editing and deleting recurring events
 */
export const useRecurringEventOperations = (
  events: Event[],
  updateEvents: (_events: Event[]) => void
) => {
  const isRecurringEvent = (event: Event): boolean => {
    return event.repeat.type !== 'none' && event.repeat.interval > 0;
  };

  const isSameRecurringSeries = (eventA: Event, eventB: Event): boolean => {
    return (
      eventA.repeat.type === eventB.repeat.type &&
      eventA.repeat.interval === eventB.repeat.interval &&
      eventA.title === eventB.title &&
      eventA.startTime === eventB.startTime &&
      eventA.endTime === eventB.endTime &&
      eventA.description === eventB.description &&
      eventA.location === eventB.location &&
      eventA.category === eventB.category
    );
  };

  const findRelatedRecurringEvents = (targetEvent: Event): Event[] => {
    if (!isRecurringEvent(targetEvent)) {
      return [];
    }

    // Find ALL events that are part of the same recurring series
    const seriesEvents = events.filter(
      (event) => isRecurringEvent(event) && isSameRecurringSeries(event, targetEvent)
    );

    // If there's only one event in the series (just the target event itself), return empty array
    // If there are multiple events in the series, return all events including the target
    return seriesEvents.length > 1 ? seriesEvents : [];
  };

  /**
   * Generic API request handler with error handling
   */
  const makeApiRequest = async (url: string, method: string, body?: unknown): Promise<boolean> => {
    try {
      const config: RequestInit = { method };

      if (body !== undefined) {
        config.headers = { 'Content-Type': 'application/json' };
        config.body = JSON.stringify(body);
      }

      const response = await fetch(url, config);
      return response.ok;
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error);
      return false;
    }
  };

  const updateEventOnServer = async (event: Event): Promise<boolean> => {
    return makeApiRequest(`${API_ENDPOINTS.events}/${event.id}`, HTTP_METHODS.PUT, event);
  };

  const deleteEventOnServer = async (eventId: string): Promise<boolean> => {
    return makeApiRequest(`${API_ENDPOINTS.events}/${eventId}`, HTTP_METHODS.DELETE);
  };

  const deleteRecurringEventOnServer = async (repeatId: string): Promise<boolean> => {
    return makeApiRequest(`${API_ENDPOINTS.recurringEvents}/${repeatId}`, HTTP_METHODS.DELETE);
  };

  const updateRecurringEventOnServer = async (
    repeatId: string,
    updateData: Partial<Event>
  ): Promise<boolean> => {
    return makeApiRequest(
      `${API_ENDPOINTS.recurringEvents}/${repeatId}`,
      HTTP_METHODS.PUT,
      updateData
    );
  };

  const createSingleEditEvent = (updatedEvent: Event): Event => ({
    ...updatedEvent,
    repeat: DEFAULT_REPEAT_CONFIG,
  });

  /**
   * Calculates the date offset in days between two dates
   */
  const calculateDateOffset = (oldDate: string, newDate: string): number => {
    const old = new Date(oldDate);
    const new_ = new Date(newDate);
    const diffTime = new_.getTime() - old.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
   * Applies date offset to a date string
   */
  const applyDateOffset = (date: string, offsetDays: number): string => {
    const dateObj = new Date(date);
    dateObj.setDate(dateObj.getDate() + offsetDays);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Prefers recurring API when repeatId is available, falls back to individual updates
   */
  const updateRecurringSeries = async (
    originalEvent: Event,
    updatedEvent: Event,
    relatedEvents: Event[]
  ): Promise<boolean> => {
    const repeatId = originalEvent.repeat.id;
    const dateChanged = originalEvent.date !== updatedEvent.date;

    if (repeatId) {
      const updateData: Partial<Event> = {
        title: updatedEvent.title,
        description: updatedEvent.description,
        location: updatedEvent.location,
        category: updatedEvent.category,
        notificationTime: updatedEvent.notificationTime,
      };

      // 날짜가 변경된 경우, 서버에서 처리할 수 있도록 date와 id를 포함
      if (dateChanged) {
        updateData.date = updatedEvent.date;
        updateData.id = originalEvent.id; // 드래그한 이벤트의 id를 전달하여 서버에서 기준 이벤트를 찾을 수 있도록 함
      }

      return await updateRecurringEventOnServer(repeatId, updateData);
    } else {
      // repeatId가 없는 경우, 각 이벤트를 개별적으로 업데이트
      let eventsToUpdate = relatedEvents;

      // 날짜가 변경된 경우, 날짜 오프셋을 계산하여 모든 관련 이벤트에 적용
      if (dateChanged) {
        // 드래그한 이벤트의 원래 날짜와 새 날짜의 차이를 계산
        const originalOffset = calculateDateOffset(originalEvent.date, updatedEvent.date);

        eventsToUpdate = relatedEvents.map((event) => {
          // 각 이벤트에 동일한 오프셋 적용
          const newDate = applyDateOffset(event.date, originalOffset);
          return {
            ...event,
            title: updatedEvent.title,
            description: updatedEvent.description,
            location: updatedEvent.location,
            category: updatedEvent.category,
            notificationTime: updatedEvent.notificationTime,
            date: newDate,
          };
        });

        // 원래 이벤트도 업데이트
        const updatedOriginalEvent = {
          ...updatedEvent,
          title: updatedEvent.title,
          description: updatedEvent.description,
          location: updatedEvent.location,
          category: updatedEvent.category,
          notificationTime: updatedEvent.notificationTime,
        };
        eventsToUpdate.push(updatedOriginalEvent);
      } else {
        // 날짜가 변경되지 않은 경우, 기존 로직 사용
        eventsToUpdate = relatedEvents.map((event) => ({
          ...event,
          title: updatedEvent.title,
          description: updatedEvent.description,
          location: updatedEvent.location,
          category: updatedEvent.category,
          notificationTime: updatedEvent.notificationTime,
        }));
      }

      const results = await Promise.all(eventsToUpdate.map((event) => updateEventOnServer(event)));
      return results.every((result) => result);
    }
  };

  /**
   * Handles editing of recurring events with user choice for scope
   * @param updatedEvent - The event with updated information
   * @param editSingleOnly - true for single event edit, false for series edit
   */
  const handleRecurringEdit = async (
    updatedEvent: Event,
    editSingleOnly: boolean
  ): Promise<void> => {
    const originalEvent = events.find((e) => e.id === updatedEvent.id);

    if (!originalEvent) {
      await updateEventOnServer(updatedEvent);
      updateEvents([]);
      return;
    }

    const relatedEvents = findRelatedRecurringEvents(originalEvent);

    if (relatedEvents.length === 0 || editSingleOnly) {
      const singleEvent = createSingleEditEvent(updatedEvent);
      await updateEventOnServer(singleEvent);
      updateEvents([]);
      return;
    }

    await updateRecurringSeries(originalEvent, updatedEvent, relatedEvents);
    updateEvents([]);
  };

  /**
   * Prefers recurring API when repeatId is available, falls back to individual deletion
   */
  const deleteRecurringSeries = async (
    eventToDelete: Event,
    relatedEvents: Event[]
  ): Promise<boolean> => {
    const repeatId = eventToDelete.repeat.id;

    if (repeatId) {
      return await deleteRecurringEventOnServer(repeatId);
    } else {
      const results = await Promise.all(
        relatedEvents.map((event) => deleteEventOnServer(event.id))
      );
      return results.every((result) => result);
    }
  };

  const executeDeleteAndRefresh = async (
    deleteOperation: () => Promise<boolean>
  ): Promise<void> => {
    await deleteOperation();
    updateEvents([]);
  };

  /**
   * Handles deletion of recurring events with user choice for scope
   * @param eventToDelete - The event to be deleted
   * @param deleteSingleOnly - true for single event deletion, false for series deletion
   */
  const handleRecurringDelete = async (
    eventToDelete: Event,
    deleteSingleOnly: boolean
  ): Promise<void> => {
    const relatedEvents = findRelatedRecurringEvents(eventToDelete);

    if (relatedEvents.length === 0) {
      await executeDeleteAndRefresh(() => deleteEventOnServer(eventToDelete.id));
      return;
    }

    if (deleteSingleOnly) {
      await executeDeleteAndRefresh(() => deleteEventOnServer(eventToDelete.id));
    } else {
      await executeDeleteAndRefresh(() => deleteRecurringSeries(eventToDelete, relatedEvents));
    }
  };

  return {
    handleRecurringEdit,
    handleRecurringDelete,
    findRelatedRecurringEvents,
  };
};
