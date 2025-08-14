import assert from "assert";
import { 
  TestHelpers,
  FiatTokenProxy_Blacklisted
} from "generated";
const { MockDb, FiatTokenProxy } = TestHelpers;

describe("FiatTokenProxy contract Blacklisted event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for FiatTokenProxy contract Blacklisted event
  const event = FiatTokenProxy.Blacklisted.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("FiatTokenProxy_Blacklisted is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await FiatTokenProxy.Blacklisted.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualFiatTokenProxyBlacklisted = mockDbUpdated.entities.FiatTokenProxy_Blacklisted.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedFiatTokenProxyBlacklisted: FiatTokenProxy_Blacklisted = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      _account: event.params._account,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualFiatTokenProxyBlacklisted, expectedFiatTokenProxyBlacklisted, "Actual FiatTokenProxyBlacklisted should be the same as the expectedFiatTokenProxyBlacklisted");
  });
});
