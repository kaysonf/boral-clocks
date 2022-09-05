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
  const MOCK_MESSAGE2 = { hello: "goodbye" };

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

  test("should resend mesasges that were not acknowledged, with next sequence number", () => {
    contributor.publish(MOCK_MESSAGE);

    contributor.publish(MOCK_MESSAGE2);

    const SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE = 3;

    const NON_ACK = {
      publisher: "ANOTHER_PUBLISHER",
      topic: TOPIC,
      seq_no: SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE,
      message: MOCK_RESPONSE,
    };

    NETWORK_MOCK.on(NON_ACK);

    expect(NETWORK_MOCK.send).toBeCalledTimes(4);

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

    expect(NETWORK_MOCK.send).toHaveBeenNthCalledWith(3, {
      type: "PUBLISH",
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE + 1,
      message: MOCK_MESSAGE,
    });

    expect(NETWORK_MOCK.send).toHaveBeenNthCalledWith(4, {
      type: "PUBLISH",
      publisher: PUBLISHER,
      topic: TOPIC,
      seq_no: SEQUENCE_AHEAD_OF_PUBLISHED_MESSAGE + 2,
      message: MOCK_MESSAGE2,
    });
  });
  //   test("should resend messages in queue if they are outdated", () => {});
});
