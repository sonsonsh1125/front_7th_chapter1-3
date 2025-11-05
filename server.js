import { randomUUID } from 'crypto';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import express from 'express';

const app = express();
const port = 3000;
const __dirname = path.resolve();

app.use(express.json());

const dbName = process.env.TEST_ENV === 'e2e' ? 'e2e.json' : 'realEvents.json';

const getEvents = async () => {
  const data = await readFile(`${__dirname}/src/__mocks__/response/${dbName}`, 'utf8');

  return JSON.parse(data);
};

app.get('/api/events', async (_, res) => {
  const events = await getEvents();
  res.json(events);
});

app.post('/api/events', async (req, res) => {
  const events = await getEvents();
  const newEvent = { id: randomUUID(), ...req.body };

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: [...events.events, newEvent],
    })
  );

  res.status(201).json(newEvent);
});

app.put('/api/events/:id', async (req, res) => {
  const events = await getEvents();
  const id = req.params.id;
  const eventIndex = events.events.findIndex((event) => event.id === id);
  if (eventIndex > -1) {
    const newEvents = [...events.events];
    newEvents[eventIndex] = { ...events.events[eventIndex], ...req.body };

    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: newEvents,
      })
    );

    res.json(events.events[eventIndex]);
  } else {
    res.status(404).send('Event not found');
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const events = await getEvents();
  const id = req.params.id;

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: events.events.filter((event) => event.id !== id),
    })
  );

  res.status(204).send();
});

app.post('/api/events-list', async (req, res) => {
  const events = await getEvents();
  const repeatId = randomUUID();
  const newEvents = req.body.events.map((event) => {
    const isRepeatEvent = event.repeat.type !== 'none';
    return {
      id: randomUUID(),
      ...event,
      repeat: {
        ...event.repeat,
        id: isRepeatEvent ? repeatId : undefined,
      },
    };
  });

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: [...events.events, ...newEvents],
    })
  );

  res.status(201).json(newEvents);
});

app.put('/api/events-list', async (req, res) => {
  const events = await getEvents();
  let isUpdated = false;

  const newEvents = [...events.events];
  req.body.events.forEach((event) => {
    const eventIndex = events.events.findIndex((target) => target.id === event.id);
    if (eventIndex > -1) {
      isUpdated = true;
      newEvents[eventIndex] = { ...events.events[eventIndex], ...event };
    }
  });

  if (isUpdated) {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: newEvents,
      })
    );

    res.json(events.events);
  } else {
    res.status(404).send('Event not found');
  }
});

app.delete('/api/events-list', async (req, res) => {
  const events = await getEvents();
  const newEvents = events.events.filter((event) => !req.body.eventIds.includes(event.id)); // ? ids를 전달하면 해당 아이디를 기준으로 events에서 제거

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: newEvents,
    })
  );

  res.status(204).send();
});

app.put('/api/recurring-events/:repeatId', async (req, res) => {
  const events = await getEvents();
  const repeatId = req.params.repeatId;
  const updateData = req.body;

  const seriesEvents = events.events.filter((event) => event.repeat.id === repeatId);

  if (seriesEvents.length === 0) {
    return res.status(404).send('Recurring series not found');
  }

  // 날짜가 변경된 경우, 날짜 오프셋을 계산
  let dateOffset = 0;
  if (updateData.date) {
    // 드래그한 이벤트를 찾아서 오프셋 계산
    // updateData.date는 드래그한 이벤트의 새 날짜
    // 드래그한 이벤트를 찾기 위해 updateData에 id가 있다면 사용, 없으면 가장 이른 날짜 사용
    let targetEvent = seriesEvents[0];
    if (updateData.id) {
      const found = seriesEvents.find((e) => e.id === updateData.id);
      if (found) targetEvent = found;
    } else {
      // id가 없으면 가장 이른 날짜의 이벤트를 기준으로 사용
      targetEvent = seriesEvents.reduce((earliest, current) => {
        return new Date(current.date) < new Date(earliest.date) ? current : earliest;
      });
    }
    const oldDate = new Date(targetEvent.date);
    const newDate = new Date(updateData.date);
    dateOffset = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const newEvents = events.events.map((event) => {
    if (event.repeat.id === repeatId) {
      let updatedEvent = {
        ...event,
        title: updateData.title !== undefined ? updateData.title : event.title,
        description: updateData.description !== undefined ? updateData.description : event.description,
        location: updateData.location !== undefined ? updateData.location : event.location,
        category: updateData.category !== undefined ? updateData.category : event.category,
        notificationTime: updateData.notificationTime !== undefined ? updateData.notificationTime : event.notificationTime,
        repeat: updateData.repeat ? { ...event.repeat, ...updateData.repeat } : event.repeat,
      };

      // 날짜가 변경된 경우, 오프셋을 적용하여 날짜 업데이트
      if (dateOffset !== 0) {
        const eventDate = new Date(event.date);
        eventDate.setDate(eventDate.getDate() + dateOffset);
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        updatedEvent.date = `${year}-${month}-${day}`;
      }

      return updatedEvent;
    }
    return event;
  });

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({ events: newEvents })
  );

  res.json(seriesEvents);
});

app.delete('/api/recurring-events/:repeatId', async (req, res) => {
  const events = await getEvents();
  const repeatId = req.params.repeatId;

  const remainingEvents = events.events.filter((event) => event.repeat.id !== repeatId);

  if (remainingEvents.length === events.events.length) {
    return res.status(404).send('Recurring series not found');
  }

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({ events: remainingEvents })
  );

  res.status(204).send();
});

app.listen(port, () => {
  if (!fs.existsSync(`${__dirname}/src/__mocks__/response/${dbName}`)) {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: [],
      })
    );
  }
  console.log(`Server running at http://localhost:${port}`);
});
