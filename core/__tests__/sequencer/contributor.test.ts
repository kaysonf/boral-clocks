import { Contributor } from "@core/sequencer";

describe("Contributor", () => {
  const PUBLISHER = "pub";
  const TOPIC = "top";

  let NETWORK_MOCK = {
    send: jest.fn(),
    on: jest.fn(),
  };

  let onReceiveFn = jest.fn();

  const MOCK_MESSAGE = { hello: "world" };

  const MOCK_RESPONSE = { goodbye: "world" };

  let contributor = new Contributor<typeof MOCK_MESSAGE, typeof MOCK_RESPONSE>(
    NETWORK_MOCK,
    PUBLISHER,
    TOPIC,
    onReceiveFn
  );

  beforeEach(() => {
    NETWORK_MOCK = {
      send: jest.fn(),
      on: jest.fn(),
    };

    onReceiveFn = jest.fn();

    contributor = new Contributor<typeof MOCK_MESSAGE, typeof MOCK_RESPONSE>(
      NETWORK_MOCK,
      PUBLISHER,
      TOPIC,
      onReceiveFn
    );
  });

  test("should resend the next unacknowldeged message in queue, with the next sequence number", () => {
    contributor.publish(MOCK_MESSAGE);

    const SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE = 2;

    const NON_ACK = {
      publisher: "ANOTHER_PUBLISHER",
      topic: TOPIC,
      seq_no: SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE,
      message: MOCK_RESPONSE,
      type: "PUBLISH",
    };

    NETWORK_MOCK.on(NON_ACK);

    expect(NETWORK_MOCK.send).toBeCalledTimes(2);

    expect(NETWORK_MOCK.send).toHaveBeenNthCalledWith(1, {
      type: "PUBLISH",
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: 1,
      message: MOCK_MESSAGE,
    });

    expect(NETWORK_MOCK.send).toHaveBeenNthCalledWith(2, {
      type: "PUBLISH",
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: 3,
      message: MOCK_MESSAGE,
    });
  });

  test("should send messages in queue on ACK message recieved, with the next sequence number", () => {
    const MOCK_MESSAGE2 = { hello: "world2" };

    contributor.publish(MOCK_MESSAGE);
    contributor.publish(MOCK_MESSAGE2);

    const ACK = {
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: 1,
      message: MOCK_MESSAGE,
      type: "ACK",
    };

    NETWORK_MOCK.on(ACK);

    expect(NETWORK_MOCK.send).toBeCalledTimes(2);

    expect(NETWORK_MOCK.send).toHaveBeenNthCalledWith(1, {
      type: "PUBLISH",
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: 1,
      message: MOCK_MESSAGE,
    });

    expect(NETWORK_MOCK.send).toHaveBeenNthCalledWith(2, {
      type: "PUBLISH",
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: 2,
      message: MOCK_MESSAGE2,
    });
  });

  test("should resend the next unacknowldeged message in queue, with the next sequence number", () => {
    contributor.publish(MOCK_MESSAGE);

    //ACK

    const ACK = {
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: 1,
      message: MOCK_RESPONSE,
      type: "PUBLISH",
    };

    NETWORK_MOCK.on(ACK);

    //PUB
    const SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE = 2;

    const PUB = {
      publisher: "ANOTHER_PUBLISHER",
      topic: TOPIC,
      seq_no: SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE,
      message: MOCK_RESPONSE,
      type: "PUBLISH",
    };

    NETWORK_MOCK.on(PUB);

    expect(NETWORK_MOCK.send).toBeCalledTimes(1);

    expect(NETWORK_MOCK.send).toHaveBeenNthCalledWith(1, {
      type: "PUBLISH",
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: 1,
      message: MOCK_MESSAGE,
    });
  });
});
