import { get } from 'request';
import { promisify } from 'util';
import { evalOnGAS } from './test-util';
declare const slackCommands: any;
declare const getFormulaImageURL: Function

describe('getFormulaImageURL', () => {
  let image_url;

  beforeAll(async () => {
    jest.setTimeout(1000 * 20);
    image_url = await evalOnGAS(function() {
      return getFormulaImageURL('a + b < c & d');
    });
  });

  it('returns available image_url', async () => {
    const { statusCode, headers, body } = await promisify(get)(image_url, undefined) as {statusCode: number, headers: {}, body: string};
    expect(statusCode).toBe(200);
    expect(headers['content-type']).toContain('image');
    expect(body).toBeTruthy();
    console.log(image_url);
  });
})

describe('slackCommands.formula', () => {
  beforeAll(async () => {
    jest.setTimeout(1000 * 20);
  });

  it('returns response to raw TeX', async () => {
    const res = await evalOnGAS(function() {
      var e = {
        text: 'a + b > c & d $ e'
      };
      return slackCommands.formula(e);
    });
    expect(res.response_type).toBe('in_channel');
    expect(res.attachments).toHaveLength(1);
    const attachment = res.attachments[0];
    expect(attachment.image_url).toBeTruthy();
    expect(typeof attachment.image_url).toBe('string');
  });

  it('returns response to text including $...$ and $$...$$ with post-text', async () => {
    const res = await evalOnGAS(function() {
      var e = {
        text: 'abc $def$g h\ni$$j\nk$$lmn'
      };
      return slackCommands.formula(e);
    });
    expect(res.response_type).toBe('in_channel');
    expect(res.attachments).toHaveLength(3);
    expect(res.attachments[0].text).toBe('abc ');
    expect(res.attachments[0].image_url).toContain(encodeURIComponent('$def$'));
    expect(res.attachments[1].text).toBe('g h\ni');
    expect(res.attachments[1].image_url).toContain(encodeURIComponent('$$j\nk$$'));
    expect(res.attachments[2].text).toBe('lmn');
    expect(res.attachments[2].image_url).toBeUndefined();
  });

  it('returns response to text including $...$ without post-text', async () => {
    const res = await evalOnGAS(function() {
      var e = {
        text: 'abc $def$g h\ni$$j\nk$$'
      };
      return slackCommands.formula(e);
    });
    expect(res.response_type).toBe('in_channel');
    expect(res.attachments).toHaveLength(2);
    expect(res.attachments[0].text).toBe('abc ');
    expect(res.attachments[0].image_url).toContain(encodeURIComponent('$def$'));
    expect(res.attachments[1].text).toBe('g h\ni');
    expect(res.attachments[1].image_url).toContain(encodeURIComponent('$$j\nk$$'));
  });
});

describe('slackCommands.question', () => {
  beforeAll(() => {
    jest.setTimeout(1000 * 20);
  });

  it('returns mentions to channel on valid input', async () => {
    const res = await evalOnGAS(function() {
      var e = {
        text: '<#' + PropertiesService.getScriptProperties().getProperty('seashore-id') + '> hoge'
      };
      return slackCommands.question(e);
    });
    expect(res.response_type).toBe('in_channel');
    expect(res.text).toMatch(/^(<@U(.+)> ?)+$/);
  });

  it('returns ephemeral error message on invalid input', async () => {
    const res = await evalOnGAS(function() {
      var e = {
        text: 'hoge'
      };
      return slackCommands.question(e);
    });
    expect(res.response_type).toBe('ephemeral');
    expect(res.text).toContain('Error');
  });
});