import {get, post} from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import {delay} from '../../src/core/utils';
import {uploadDir} from '../../src/client/storage';

jest.retryTimes(60);

describe('Storage requests through proxy', () => {
    // These cases are not handled properly with the current proxy implementation
    // TODO: no response if there are no files
    // TODO: multiple files are not handled
    // TODO: anything but form-data will fail with 500
    // TODO: posting to /_storage (without trailing slash) will trigger wrong handler
    // TODO: trying to get a non-existing file fails with 500 instead of 404

    let fileId;
    // TODO: super weird behavior in this test! If we change proxy protocol to http,
    // it returns 500! While localhost proxy cannot be https! This can be either related to
    // improper axios handling of redirects, or issues inside proxy on a low level
    // This should be investigated and, if needed, fixed during refactoring
    it('Should upload file through proxy', async () => {
        expect.assertions(1);

        const file = fs.createReadStream(path.join(__dirname, '..', 'resources', 'sample-image.jpg'));
        const form = new FormData();
        form.append('my_file', file);

        const res = await post(
            // axios will perform GET instead of POST if there's a trailing slash in the URL,
            // and, as mentioned above, proxy expects a slash after /_storage,
            // so we should add some path in order this to work
            'https://somehost.point/_storage/something',
            form,
            {
                headers: form.getHeaders(),
                proxy: {host: 'point_node', port: 8666, protocol: 'https'},
                validateStatus: () => true
            }
        );
        fileId = res.data.data;
        expect(res.status).toEqual(200);
    });

    it('Should download file through proxy', async () => {
        expect.assertions(1);

        await delay(5000);
        const res = await get(
            `https://somehost.point/_storage/${fileId}`,
            {proxy: {host: 'point_node', port: 8666, protocol: 'http'}}
        );
        expect(res.status).toEqual(200);
    }, 300000);

    // TODO: neither proxy nor API don't handle directory upload, we can only do it
    // using storage method
    let dirId;
    it('TODO: replace this test with uploading folder through proxy', async () => {
        expect.assertions(1);
        dirId = await uploadDir(path.join(__dirname, '../resources/sample_folder'));
        expect(dirId).toBeTruthy();
    });

    it('Should download uploaded folder', async () => {
        expect.assertions(5);
        await delay(5000);

        const res = await get(
            `https://somehost.point/_storage/${dirId}`,
            {proxy: {host: 'point_node', port: 8666, protocol: 'http'}}
        );

        expect(res.status).toEqual(200);
        expect(res.data).toMatch(/^<html>/);
        expect(res.data).toMatch(`<h1>Index of ${dirId}</h1>`);
        expect(res.data).toMatch('sample-image-2.jpg;');
        expect(res.data).toMatch('sample-image-3.jpg;');
    }, 300000);
});
