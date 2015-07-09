/* global before, after, afterEach, describe, it, beforeEach */

'use strict';

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    copyFileWithReplacements = require('../../../../lib/utils/copy-file-with-replacements'),
    proxyquire = require('proxyquire').noCallThru(),
    sinon = require('sinon');

describe('templates/yadda-lib', function () {

    var testee,
        stubs = {},
        stepsFilePattern = 'steps/**/*.steps.js';

    function createYaddaLib(localisation) {
        fs.mkdirSync(path.resolve(__dirname, 'sandbox'));
        copyFileWithReplacements(path.resolve(__dirname, '../../../../lib/templates/yadda-lib-template.txt'),
                                path.resolve(__dirname, 'sandbox/yadda-lib.js'),
                                {
                                    '{steps_location}': JSON.stringify(stepsFilePattern),
                                    '{localisation}': localisation
                                });
    }

    function requireYaddaLibWithStubs() {
        stubs.fs = {
            readFileSync: sinon.stub().returns('a feature'),
            writeFileSync: sinon.stub()
        };
        stubs['../yadda-lib'] = {
            yadda: sinon.stub()
        };
        stubs.defaultLibraryDefine = sinon.stub();
        stubs.englishLibraryDefine = sinon.stub();
        stubs.frenchLibraryDefine = sinon.stub();
        stubs.yadda = {
            localisation: {
                English: {
                    library: sinon.stub().returns({
                        define: stubs.englishLibraryDefine
                    })
                },
                French: {
                    library: sinon.stub().returns({
                        define: stubs.frenchLibraryDefine
                    })
                }
            },
            Library: sinon.stub().returns({
                define: stubs.defaultLibraryDefine
            }),
            Yadda: sinon.spy(function () {
                this.title = 'Yadda Instance';
            })
        };

        var files = ['steps.js', 'path/to/steps.js', 'steppy.js'];

        stubs['glob-all'] = {
            sync: sinon.stub().returns(files)
        };
        files.forEach(function (file) {
            stubs[path.resolve(process.cwd(), file)] = sinon.stub();
        });
        return proxyquire('./sandbox/yadda-lib', stubs);
    }

    function deleteYaddaLib() {
        rimraf.sync(path.resolve(__dirname, 'sandbox'));
    }


    describe('localisation', function () {

        afterEach(function () {
            deleteYaddaLib();
        });

        it('should use default library if no localisation given', function () {
            createYaddaLib(null);
            var testee = requireYaddaLibWithStubs();
            assert.equal(stubs.yadda.Library.callCount, 1);
        });

        it('should use localisation library if localisation given - I', function () {
            createYaddaLib('\'English\'');
            var testee = requireYaddaLibWithStubs();
            assert.equal(stubs.yadda.localisation.English.library.callCount, 1);
        });

        it('should use localisation library if localisation given - II', function () {
            createYaddaLib('\'French\'');
            var testee = requireYaddaLibWithStubs();
            assert.equal(stubs.yadda.localisation.French.library.callCount, 1);
        });

    });

    describe('other actions', function () {

        var testee;
        before(function () {
            createYaddaLib(null);
            testee = requireYaddaLibWithStubs();
        });

        after(function () {
            deleteYaddaLib();
        });

        it('should define a close browser step on the library', function () {
            assert.equal(stubs.defaultLibraryDefine.callCount, 1);
            assert.equal(stubs.defaultLibraryDefine.args[0][0], 'close_browser');
            var callback = stubs.defaultLibraryDefine.args[0][1],
                browser = {
                    end: sinon.stub()
                };
            callback.call({browser: browser});
            assert.equal(browser.end.callCount, 1);
        });

        it('should call each step file passing in the library', function () {
            stubs['glob-all'].sync().forEach(function (file) {
                assert.equal(stubs[path.resolve(process.cwd(), file)].callCount, 1);
                assert.equal(stubs[path.resolve(process.cwd(), file)].args[0][0].define, stubs.defaultLibraryDefine);
            });
        });

        it('should create new Yadda instance using library and return it', function () {
            assert.equal(stubs.yadda.Yadda.callCount, 1);
            assert.equal(stubs.yadda.Yadda.args[0][0].define, stubs.defaultLibraryDefine);
            assert.equal(testee.title, 'Yadda Instance');
        });
    });


});