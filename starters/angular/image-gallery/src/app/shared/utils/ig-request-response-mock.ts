import { MockFn } from '@ngx-templates/shared/fetch';
import Images from '../../../../public/data.json';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

/**
 * Returns mocked data based on a request URL
 *
 * @param url Request URL
 * @returns
 */
export const imgGalleryRequestResponseMock: MockFn = (url: string): object => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any = {};
  const paramsStr = url.split('?').pop();

  const params: { [key: string]: string } = paramsStr
    ? paramsStr
        .split('&')
        .map((pair) => pair.split('='))
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
    : {};

  if (/images\??[\w,=\-\\+&]*$/.test(url)) {
    const page = ~~params['page'] || DEFAULT_PAGE;
    const pageSize = ~~params['pageSize'] || DEFAULT_PAGE_SIZE;
    const idx = (page - 1) * pageSize;

    response = {
      total: Images.length,
      images: Images.slice(idx, idx + pageSize),
    };
  }

  if (/image\/[0-9]+/.test(url)) {
    const idx = parseInt(url.split('/').pop() || '', 10);

    if (!isNaN(idx)) {
      const img = Images[idx];
      response = img;
    }
  }

  return response;
};
