import { deprecationWarning } from './deprecationWarning';
import { getStructuredLogger, setStructuredLogger, type StructuredLogger } from './structuredLogging';

test('It should not output deprecation warnings too often', () => {
  let dateNowValue = 10000000;

  const originalLogger = getStructuredLogger();
  const loggerSpy: StructuredLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  setStructuredLogger(loggerSpy);
  const spyDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => dateNowValue);
  // Make sure the mock works
  expect(Date.now()).toEqual(dateNowValue);
  expect(loggerSpy.warn).toHaveBeenCalledTimes(0);

  // Call the deprecation many times
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  expect(loggerSpy.warn).toHaveBeenCalledTimes(1);

  // Increment the time by 1min
  dateNowValue += 60000;
  deprecationWarning('file', 'oldName', 'newName');
  deprecationWarning('file', 'oldName', 'newName');
  expect(loggerSpy.warn).toHaveBeenCalledTimes(2);

  deprecationWarning('file2', 'oldName', 'newName');
  deprecationWarning('file2', 'oldName', 'newName');
  deprecationWarning('file2', 'oldName', 'newName');
  expect(loggerSpy.warn).toHaveBeenCalledTimes(3);

  // or restoreMocks automatically?
  setStructuredLogger(originalLogger);
  spyDateNow.mockRestore();
});
