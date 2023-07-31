import { checkPathType } from '.';

describe('checkPathType', () => {
  it('should return "path"', () => {
    expect(
      checkPathType(
        process.env.LOCAL_EML_PATH ||
          '/Users/walterdiaz/Downloads/Test_JSON_inside_mail_attachment.eml',
      ),
    ).toBe('path');
  });
  it('should return "url"', () => {
    expect(
      checkPathType(
        'https://proud-of.s3.filebase.com/Test JSON inside mail attachment.eml',
      ),
    ).toBe('url');
  });
  it('should return "invalid"', () => {
    expect(checkPathType('invalid-path')).toBe('invalid');
  });
});
