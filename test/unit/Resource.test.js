var request,
    res,
    xhr,
    url = 'http://localhost/file',
    headers = { 'Content-Type': 'application/json' },
    json = '[{ "id": 12, "comment": "Hey there" }]';

before(function () {
    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function (req) { request = req; };
});

after(function () {
    xhr.restore();
});

describe('Resource', function () {
    beforeEach(function () {
        res = new Resource(url);
        request = null;
    });

    it('should construct properly with only a URL passed', function () {
        expect(res).to.have.property('url', url);
        expect(res).to.have.property('data', null);
        expect(res).to.not.have.property('crossOrigin'); //technically has the prop, but it is undefined
        expect(res).to.have.property('loadType', Resource.LOAD_TYPE.XHR);
        expect(res).to.have.property('xhrType', Resource.XHR_RESPONSE_TYPE.DEFAULT);
        expect(res).to.have.property('error', null);
        expect(res).to.have.property('xhr', null);
    });

    it('should construct properly with options passed', function () {
        var res = new Resource(url, {
            crossOrigin: true,
            loadType: Resource.LOAD_TYPE.IMAGE,
            xhrType: Resource.XHR_RESPONSE_TYPE.BLOB
        });

        expect(res).to.have.property('url', url);
        expect(res).to.have.property('data', null);
        expect(res).to.have.property('crossOrigin', true);
        expect(res).to.have.property('loadType', Resource.LOAD_TYPE.IMAGE);
        expect(res).to.have.property('xhrType', Resource.XHR_RESPONSE_TYPE.BLOB);
        expect(res).to.have.property('error', null);
        expect(res).to.have.property('xhr', null);
    });

    describe('#complete', function () {
        it('should emit the `complete` event', function () {
            var spy = sinon.spy();

            res.on('complete', spy);

            res.complete();

            expect(spy).to.have.been.calledWith(res);
        });

        it('should remove events from the data element', function () {
            var data = {
                    addEventListener: function () {},
                    removeEventListener: function () {}
                },
                mock = sinon.mock(data);

            mock.expects('removeEventListener').once().withArgs('error');
            mock.expects('removeEventListener').once().withArgs('load');
            mock.expects('removeEventListener').once().withArgs('progress');
            mock.expects('removeEventListener').once().withArgs('canplaythrough');

            res.data = data;
            res.complete();

            mock.verify();
        });

        it('should remove events from the xhr element', function () {
            var data = {
                    addEventListener: function () {},
                    removeEventListener: function () {}
                },
                mock = sinon.mock(data);

            mock.expects('removeEventListener').once().withArgs('error');
            mock.expects('removeEventListener').once().withArgs('abort');
            mock.expects('removeEventListener').once().withArgs('progress');
            mock.expects('removeEventListener').once().withArgs('load');

            res.xhr = data;
            res.complete();

            mock.verify();
        });
    });

    describe('#load', function () {
        it('should emit the start event', function () {
            var spy = sinon.spy();

            res.on('start', spy);

            res.load();

            expect(request).to.exist;
            expect(spy).to.have.been.calledWith(res);
        });

        it('should emit the complete event', function () {
            var spy = sinon.spy();

            res.on('complete', spy);

            res.load();

            request.respond(200, headers, json);

            expect(request).to.exist;
            expect(spy).to.have.been.calledWith(res);
        });

        it('should load using XHR', function (done) {
            res.on('complete', function () {
                expect(res).to.have.property('data', json);
                done();
            });

            res.load();

            expect(request).to.exist;

            request.respond(200, headers, json);
        });

        it('should load using Image', function () {
            var res = new Resource(url, { loadType: Resource.LOAD_TYPE.IMAGE });

            res.load();

            expect(request).to.not.exist;

            expect(res).to.have.property('data').instanceOf(Image)
                .and.is.an.instanceOf(HTMLImageElement)
                .and.has.property('src', url);
        });

        it('should load using Audio', function () {
            var res = new Resource(url, { loadType: Resource.LOAD_TYPE.AUDIO });

            res.load();

            expect(request).to.not.exist;

            expect(res).to.have.property('data').instanceOf(HTMLAudioElement);

            expect(res.data.children).to.have.length(1);
            expect(res.data.children[0]).to.have.property('src', url);
        });

        it('should load using Video', function () {
            var res = new Resource(url, { loadType: Resource.LOAD_TYPE.VIDEO });

            res.load();

            expect(request).to.not.exist;

            expect(res).to.have.property('data').instanceOf(HTMLVideoElement);

            expect(res.data.children).to.have.length(1);
            expect(res.data.children[0]).to.have.property('src', url);
        });
    });
});