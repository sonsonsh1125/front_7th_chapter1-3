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
  Tooltip,
  Typography,
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
  title: 'Cell Text Length/Text Handling',
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

// Mock 이벤트 데이터
const shortTitleEvent: Event = {
  id: '1',
  title: '회의',
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '11:00',
  description: '짧은 제목',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const mediumTitleEvent: Event = {
  id: '2',
  title: '프로젝트 진행 상황 회의',
  date: '2024-01-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '중간 길이 제목',
  location: '회의실 B',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 60,
};

const longTitleEvent: Event = {
  id: '3',
  title:
    '매우 긴 제목을 가진 일정입니다. 이 일정은 텍스트 오버플로우 처리를 테스트하기 위한 것입니다.',
  date: '2024-01-15',
  startTime: '16:00',
  endTime: '17:00',
  description: '긴 제목 테스트',
  location: '회의실 C',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 120,
};

const veryLongTitleEvent: Event = {
  id: '4',
  title:
    '이것은 매우 매우 긴 제목입니다. 이 제목은 셀의 너비를 초과하여 말줄임표로 표시되어야 합니다. 텍스트 오버플로우 처리가 제대로 작동하는지 확인하기 위한 테스트입니다.',
  date: '2024-01-15',
  startTime: '18:00',
  endTime: '19:00',
  description: '매우 긴 제목 테스트',
  location: '회의실 D',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 1440,
};

const longTitleWithIcons: Event = {
  id: '5',
  title: '매우 긴 제목을 가진 알림이 있고 반복되는 일정입니다.',
  date: '2024-01-16',
  startTime: '09:00',
  endTime: '10:00',
  description: '긴 제목 + 아이콘 테스트',
  location: '온라인',
  category: '업무',
  repeat: { type: 'daily', interval: 1, endDate: '2024-12-31' },
  notificationTime: 10,
};

const multipleLongEvents: Event[] = [
  {
    id: '1',
    title: '첫 번째 매우 긴 제목을 가진 일정입니다.',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '10:00',
    description: '긴 제목 1',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '두 번째 매우 긴 제목을 가진 일정입니다.',
    date: '2024-01-15',
    startTime: '10:30',
    endTime: '11:30',
    description: '긴 제목 2',
    location: '회의실 B',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 60,
  },
  {
    id: '3',
    title: '세 번째 매우 긴 제목을 가진 일정입니다.',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '긴 제목 3',
    location: '회의실 C',
    category: '가족',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 120,
  },
  {
    id: '4',
    title: '네 번째 매우 긴 제목을 가진 일정입니다.',
    date: '2024-01-15',
    startTime: '16:00',
    endTime: '17:00',
    description: '긴 제목 4',
    location: '회의실 D',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1440,
  },
];

// Week View 스토리들
export const WeekViewShortText: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={[shortTitleEvent]} />,
};

export const WeekViewMediumText: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={[mediumTitleEvent]} />,
};

export const WeekViewLongText: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={[longTitleEvent]} />,
};

export const WeekViewVeryLongText: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={[veryLongTitleEvent]} />,
};

export const WeekViewLongTextWithIcons: Story = {
  render: () => (
    <WeekView
      currentDate={new Date(2024, 0, 15)}
      events={[longTitleWithIcons]}
      notifiedEvents={['5']}
    />
  ),
};

export const WeekViewMultipleLongText: Story = {
  render: () => <WeekView currentDate={new Date(2024, 0, 15)} events={multipleLongEvents} />,
};

// Month View 스토리들
export const MonthViewShortText: Story = {
  render: () => <MonthView currentDate={new Date(2024, 0, 1)} events={[shortTitleEvent]} />,
};

export const MonthViewMediumText: Story = {
  render: () => <MonthView currentDate={new Date(2024, 0, 1)} events={[mediumTitleEvent]} />,
};

export const MonthViewLongText: Story = {
  render: () => <MonthView currentDate={new Date(2024, 0, 1)} events={[longTitleEvent]} />,
};

export const MonthViewVeryLongText: Story = {
  render: () => <MonthView currentDate={new Date(2024, 0, 1)} events={[veryLongTitleEvent]} />,
};

export const MonthViewLongTextWithIcons: Story = {
  render: () => (
    <MonthView
      currentDate={new Date(2024, 0, 1)}
      events={[longTitleWithIcons]}
      notifiedEvents={['5']}
    />
  ),
};

export const MonthViewMultipleLongText: Story = {
  render: () => <MonthView currentDate={new Date(2024, 0, 1)} events={multipleLongEvents} />,
};

// 텍스트 길이 비교
export const TextLengthComparison: Story = {
  render: () => (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: '1200px' }}>
      <Typography variant="h5">텍스트 길이별 처리 비교</Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            짧은 텍스트
          </Typography>
          <WeekView currentDate={new Date(2024, 0, 15)} events={[shortTitleEvent]} />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            중간 길이 텍스트
          </Typography>
          <WeekView currentDate={new Date(2024, 0, 15)} events={[mediumTitleEvent]} />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            긴 텍스트
          </Typography>
          <WeekView currentDate={new Date(2024, 0, 15)} events={[longTitleEvent]} />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            매우 긴 텍스트
          </Typography>
          <WeekView currentDate={new Date(2024, 0, 15)} events={[veryLongTitleEvent]} />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            긴 텍스트 + 아이콘
          </Typography>
          <WeekView
            currentDate={new Date(2024, 0, 15)}
            events={[longTitleWithIcons]}
            notifiedEvents={['5']}
          />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            여러 긴 텍스트
          </Typography>
          <WeekView currentDate={new Date(2024, 0, 15)} events={multipleLongEvents} />
        </Box>
      </Stack>
    </Stack>
  ),
};

// 같은 셀에 여러 길이의 텍스트
export const MixedTextLengthsInCell: Story = {
  render: () => (
    <WeekView
      currentDate={new Date(2024, 0, 15)}
      events={[shortTitleEvent, mediumTitleEvent, longTitleEvent, veryLongTitleEvent]}
    />
  ),
};

// Month View에서 여러 길이의 텍스트
export const MonthViewMixedTextLengths: Story = {
  render: () => (
    <MonthView
      currentDate={new Date(2024, 0, 1)}
      events={[shortTitleEvent, mediumTitleEvent, longTitleEvent, veryLongTitleEvent]}
    />
  ),
};

// 매우 많은 긴 텍스트 일정
export const ManyLongTextEvents: Story = {
  render: () => {
    const manyLongEvents: Event[] = Array.from({ length: 10 }, (_, i) => ({
      id: `event-${i}`,
      title: `${i + 1}번째 매우 긴 제목을 가진 일정입니다. 이 일정은 셀에 여러 개의 긴 텍스트가 있을 때 처리를 테스트합니다.`,
      date: '2024-01-15',
      startTime: `${8 + i}:00`,
      endTime: `${9 + i}:00`,
      description: `긴 제목 ${i + 1}`,
      location: `회의실 ${String.fromCharCode(65 + i)}`,
      category: ['업무', '개인', '가족', '기타'][i % 4],
      repeat: { type: 'none' as const, interval: 0 },
      notificationTime: [1, 10, 60, 120][i % 4],
    }));
    return <WeekView currentDate={new Date(2024, 0, 15)} events={manyLongEvents} />;
  },
};

// Week View vs Month View 비교
export const WeekVsMonthTextHandling: Story = {
  render: () => (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: '1200px' }}>
      <Typography variant="h5">Week View vs Month View 텍스트 처리 비교</Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Week View - 긴 텍스트
          </Typography>
          <WeekView currentDate={new Date(2024, 0, 15)} events={[veryLongTitleEvent]} />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            Month View - 긴 텍스트
          </Typography>
          <MonthView currentDate={new Date(2024, 0, 1)} events={[veryLongTitleEvent]} />
        </Box>
      </Stack>
    </Stack>
  ),
};
