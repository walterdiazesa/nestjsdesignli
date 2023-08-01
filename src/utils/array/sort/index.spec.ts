import { prioritizeJSONEndedLinks } from '.';

const links = [
  'https://pastebin.com/bNgAT6RpLorem',
  'https://github.com/aws/aws-lambda-go/blob/main/events/testdata/ses-sns-event.json',
  'http://www.json.org/JSON_checker/test/pass1.json',
];

describe('prioritizeJSONEndedLinks', () => {
  it('should prioritize links with termination on .json', () => {
    // There's only one link that doesn't end with '.json', the first one (pastebin), as soon as that link endup at last, its correct
    expect([...links].sort(prioritizeJSONEndedLinks).pop()).toEqual(links[0]);
  });
});
