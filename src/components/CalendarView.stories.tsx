import { Notifications, Repeat } from '@mui/icons-material';
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';

import { Event } from '../types';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils';

const meta: Meta = {
  title: 'Calendar/CalendarView',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const getRepeatTypeLabel = (type: string): string => {
  switch (type) {
    case 'daily':
      return '일';
    case 'weekly':
      return '주';
    case 'monthly':
      return '월';
    case 'yearly':
      return '년';
    default:
      return '';
  }
};

// Mock 이벤트 데이터
const mockEventsEmpty: Event[] = [];

const mockEventsBasic: Event[] = [
  {
    id: '1',
    title: '회의',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '팀 회의',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '점심 약속',
    date: '2024-01-16',
    startTime: '12:00',
    endTime: '13:00',
    description: '친구와 점심',
    location: '식당',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 60,
  },
];

const mockEventsWithNotifications: Event[] = [
  {
    id: '1',
    title: '중요한 회의',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '팀 회의',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '알림이 있는 일정',
    date: '2024-01-16',
    startTime: '14:00',
    endTime: '15:00',
    description: '알림 테스트',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
];

const mockEventsWithRepeating: Event[] = [
  {
    id: '1',
    title: '매일 반복 회의',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '10:00',
    description: '데일리 스탠드업',
    location: '온라인',
    category: '업무',
    repeat: { type: 'daily', interval: 1, endDate: '2024-12-31' },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '주간 회의',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 리뷰',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'weekly', interval: 1, endDate: '2024-12-31' },
    notificationTime: 60,
  },
  {
    id: '3',
    title: '월간 회의',
    date: '2024-01-15',
    startTime: '16:00',
    endTime: '17:00',
    description: '월간 리뷰',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'monthly', interval: 1, endDate: '2024-12-31' },
    notificationTime: 120,
  },
];

const mockEventsMany: Event[] = Array.from({ length: 20 }, (_, i) => ({
  id: `event-${i}`,
  title: `일정 ${i + 1}`,
  date: `2024-01-${15 + (i % 10)}`,
  startTime: `${9 + (i % 8)}:00`,
  endTime: `${10 + (i % 8)}:00`,
  description: `설명 ${i + 1}`,
  location: `위치 ${i + 1}`,
  category: ['업무', '개인', '가족', '기타'][i % 4],
  repeat: { type: 'none' as const, interval: 0 },
  notificationTime: [1, 10, 60, 120][i % 4],
}));

const mockHolidays: { [key: string]: string } = {
  '2024-01-01': '신정',
  '2024-01-15': '설날',
};

// Week View 컴포넌트
const WeekView = ({
  currentDate,
  events,
  notifiedEvents = [],
}: {
  currentDate: Date;
  events: Event[];
  notifiedEvents?: string[];
}) => {
  const weekDates = getWeekDates(currentDate);

  return (
    <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
      <Typography variant="h5">{formatWeek(currentDate)}</Typography>
      <TableContainer>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              {weekDays.map((day) => (
                <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {weekDates.map((date) => (
                <TableCell
                  key={date.toISOString()}
                  sx={{
                    height: '120px',
                    verticalAlign: 'top',
                    width: '14.28%',
                    padding: 1,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {date.getDate()}
                  </Typography>
                  {events
                    .filter((event) => new Date(event.date).toDateString() === date.toDateString())
                    .map((event) => {
                      const isNotified = notifiedEvents.includes(event.id);
                      const isRepeating = event.repeat.type !== 'none';

                      return (
                        <Box
                          key={event.id}
                          sx={{
                            p: 0.5,
                            my: 0.5,
                            backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
                            borderRadius: 1,
                            fontWeight: isNotified ? 'bold' : 'normal',
                            color: isNotified ? '#d32f2f' : 'inherit',
                            minHeight: '18px',
                            width: '100%',
                            overflow: 'hidden',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            {isNotified && <Notifications fontSize="small" />}
                            {isRepeating && (
                              <Tooltip
                                title={`${event.repeat.interval}${getRepeatTypeLabel(
                                  event.repeat.type
                                )}마다 반복${
                                  event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
                                }`}
                              >
                                <Repeat fontSize="small" />
                              </Tooltip>
                            )}
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                            >
                              {event.title}
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    })}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

// Month View 컴포넌트
const MonthView = ({
  currentDate,
  events,
  holidays = {},
  notifiedEvents = [],
}: {
  currentDate: Date;
  events: Event[];
  holidays?: { [key: string]: string };
  notifiedEvents?: string[];
}) => {
  const weeks = getWeeksAtMonth(currentDate);

  return (
    <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
      <Typography variant="h5">{formatMonth(currentDate)}</Typography>
      <TableContainer>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              {weekDays.map((day) => (
                <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {weeks.map((week, weekIndex) => (
              <TableRow key={weekIndex}>
                {week.map((day, dayIndex) => {
                  const dateString = day ? formatDate(currentDate, day) : '';
                  const holiday = holidays[dateString];
                  const cellDate = day
                    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    : null;

                  return (
                    <TableCell
                      key={dayIndex}
                      sx={{
                        height: '120px',
                        verticalAlign: 'top',
                        width: '14.28%',
                        padding: 1,
                        border: '1px solid #e0e0e0',
                        overflow: 'hidden',
                        cursor: cellDate ? 'pointer' : 'default',
                        '&:hover': cellDate
                          ? {
                              backgroundColor: '#f5f5f5',
                            }
                          : {},
                      }}
                    >
                      {day && (
                        <>
                          <Typography variant="body2" fontWeight="bold">
                            {day}
                          </Typography>
                          {holiday && (
                            <Typography variant="body2" color="error">
                              {holiday}
                            </Typography>
                          )}
                          {getEventsForDay(
                            events.filter(
                              (event) =>
                                new Date(event.date).getMonth() === currentDate.getMonth() &&
                                new Date(event.date).getFullYear() === currentDate.getFullYear()
                            ),
                            day
                          ).map((event) => {
                            const isNotified = notifiedEvents.includes(event.id);
                            const isRepeating = event.repeat.type !== 'none';

                            return (
                              <Box
                                key={event.id}
                                sx={{
                                  p: 0.5,
                                  my: 0.5,
                                  backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
                                  borderRadius: 1,
                                  fontWeight: isNotified ? 'bold' : 'normal',
                                  color: isNotified ? '#d32f2f' : 'inherit',
                                  minHeight: '18px',
                                  width: '100%',
                                  overflow: 'hidden',
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {isNotified && <Notifications fontSize="small" />}
                                  {isRepeating && (
                                    <Tooltip
                                      title={`${event.repeat.interval}${getRepeatTypeLabel(
                                        event.repeat.type
                                      )}마다 반복${
                                        event.repeat.endDate
                                          ? ` (종료: ${event.repeat.endDate})`
                                          : ''
                                      }`}
                                    >
                                      <Repeat fontSize="small" />
                                    </Tooltip>
                                  )}
                                  <Typography
                                    variant="caption"
                                    noWrap
                                    sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                                  >
                                    {event.title}
                                  </Typography>
                                </Stack>
                              </Box>
                            );
                          })}
                        </>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

// Week View 스토리들
export const WeekViewEmpty: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={mockEventsEmpty} />,
};

export const WeekViewBasic: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={mockEventsBasic} />,
};

export const WeekViewWithNotifications: Story = {
  render: () => (
    <WeekView
      currentDate={new Date(2024, 0, 15)}
      events={mockEventsWithNotifications}
      notifiedEvents={['1', '2']}
    />
  ),
};

export const WeekViewWithRepeating: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={mockEventsWithRepeating} />,
};

export const WeekViewManyEvents: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={mockEventsMany} />,
};

// Month View 스토리들
export const MonthViewEmpty: Story = {
  render: () => <MonthView currentDate={new Date(2024, 0, 1)} events={mockEventsEmpty} />,
};

export const MonthViewBasic: Story = {
  render: () => (
    <MonthView
      currentDate={new Date(2024, 0, 1)}
      events={mockEventsBasic}
      holidays={mockHolidays}
    />
  ),
};

export const MonthViewWithNotifications: Story = {
  render: () => (
    <MonthView
      currentDate={new Date(2024, 0, 1)}
      events={mockEventsWithNotifications}
      holidays={mockHolidays}
      notifiedEvents={['1', '2']}
    />
  ),
};

export const MonthViewWithRepeating: Story = {
  render: () => (
    <MonthView
      currentDate={new Date(2024, 0, 1)}
      events={mockEventsWithRepeating}
      holidays={mockHolidays}
    />
  ),
};

export const MonthViewManyEvents: Story = {
  render: () => (
    <MonthView currentDate={new Date(2024, 0, 1)} events={mockEventsMany} holidays={mockHolidays} />
  ),
};

export const MonthViewWithHolidays: Story = {
  render: () => (
    <MonthView
      currentDate={new Date(2024, 0, 1)}
      events={mockEventsBasic}
      holidays={{
        '2024-01-01': '신정',
        '2024-01-15': '설날',
        '2024-01-20': '대보름',
      }}
    />
  ),
};

// 다른 달 뷰
export const MonthViewFebruary: Story = {
  render: () => <MonthView currentDate={new Date(2024, 1, 1)} events={mockEventsBasic} />,
};

export const MonthViewDecember: Story = {
  render: () => <MonthView currentDate={new Date(2024, 11, 1)} events={mockEventsBasic} />,
};
