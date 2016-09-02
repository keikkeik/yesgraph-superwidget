describe('testSuperwidgetUI', function() {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
    jasmine.getFixtures().load('fixtures.html.js');   // load a template
    var widget;

    beforeEach(function (done) {
        // Wait for the Superwidget to be ready
        if (window.YesGraphAPI && window.YesGraphAPI.Superwidget && window.YesGraphAPI.Superwidget.isReady) {
            finishPrep();
        } else {
            $(document).on("installed.yesgraph.superwidget", finishPrep);
        }
        function finishPrep(){
            widget = window.YesGraphAPI.Superwidget;
            window.YesGraphAPI.isTestMode(true);
            done();
        }
    });

    afterEach(function() {
        // jasmine.getFixtures().cleanUp();
        // jasmine.getFixtures().clearCache();
    });

    describe("testInstall", function() {
        beforeEach(function (done){
            // Wait for Clipboard.js to be ready
            if (window.Clipboard) {
                done();
            } else {
                var interval = setInterval(function(){
                    if (window.Clipboard) {
                        clearInterval(interval);
                        done();
                    }
                }, 100);
            }
        });

        it('Should load Clipboard.js', function() {
            var originalClipboard = window.Clipboard;
            spyOn($, 'getScript').and.callFake(function(url){
                var d = $.Deferred();
                window.Clipboard = originalClipboard;
                d.resolve();
                return d.promise();
            });

            // Clipboard has been loaded already, so
            // check that we don't reload the script
            expect(window.Clipboard).toBeDefined();
            window.YesGraphAPI.utils.loadClipboard();
            expect($.getScript).not.toHaveBeenCalled();

            // Remove Clipboard, and then check that
            // we can replace it with loadClipboard()
            window.Clipboard = undefined;
            expect(window.Clipboard).not.toBeDefined();

            window.YesGraphAPI.utils.loadClipboard();
            expect($.getScript).toHaveBeenCalled();
            expect(window.Clipboard).toBeDefined();
        });

        it('configureClipboard() should fail gracefully', function() {
            // Save the existing version of Clipboard
            var originalClipboard = window.Clipboard;
            expect(originalClipboard).toBeDefined();

            // Replace it with an illegal constructor
            var someInvalidConstructor = "foo";
            window.Clipboard = someInvalidConstructor;

            // Because window.Clipboard is defined,
            // loadClipboard() won't reload the script
            window.YesGraphAPI.utils.loadClipboard();

            // Because window.Clipboard is not a valid constructor,
            // configureClipboard() should fail gracefully
            expect(window.YesGraphAPI.utils.configureClipboard).not.toThrow();

            // Cleanup
            window.Clipboard = originalClipboard;
        });

    });

    describe('testWidgetContainer', function(){
        it('Should load widget container', function() {
            expect(widget.container).toBeDefined();
        });
        it('Should load contact import section', function() {
            expect(widget.container.find(".yes-contact-import-section").length).toEqual(1);
        });
        it('Should load manual input form', function() {
            expect(widget.container.find(".yes-manual-input-form").length).toEqual(1);
        });
        it('Should load invite link section', function() {
            expect(widget.container.find(".yes-invite-link-section").length).toEqual(1);
            expect(widget.container.find("#yes-invite-link").val()).toEqual("www.example.com?foo=bar");
        });
        it('Should load share button section', function() {
            expect(widget.container.find(".yes-share-btn-section").length).toEqual(1);
        });
    });

    describe("testOAuthUtils", function() {
        it("Should parse URL params", function() {
            var url = "www.example.com/?foo=bar";
            expect(YesGraphAPI.utils.getUrlParam(url, "foo")).toEqual("bar");

            url = "www.example.com/#foo=bar";
            expect(YesGraphAPI.utils.getUrlParam(url, "foo")).toEqual("bar");

            url = "www.example.com/?foo=bar#qux=quux";
            expect(YesGraphAPI.utils.getUrlParam(url, "foo")).toEqual("bar");
            expect(YesGraphAPI.utils.getUrlParam(url, "qux")).toEqual("quux");

            url = "www.example.com";
            expect(YesGraphAPI.utils.getUrlParam(url, "foo")).toBeNull();
        });
    });

    describe("testEmailValidation", function() {
        it("Should identify valid email recipients", function() {
            var inputField = widget.container.find(".yes-manual-input-field");
            inputField.val("valid@email.com");

            expect(function(){
                var recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                return recipients[0].email;
            }()).toEqual("valid@email.com");
        });

        it("Should reject invalid email recipients", function() {
            var inputField = widget.container.find(".yes-manual-input-field");
            inputField.val("not-a-valid-email");

            expect(function(){
                var recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                return recipients.length;
            }()).toEqual(0); // No valid recipients should be returned
        });

        it("Should identify multiple email recipients", function() {
            var inputField = widget.container.find(".yes-manual-input-field");
            var emails = ["valid+1@email.com", "valid+2@email.com", "valid+3@email.com"];
            var recipients;

            inputField.val(emails.join(",")); // separated by comma
            recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
            expect(recipients.length).toEqual(emails.length);

            inputField.val(emails.join(";")); // separated by semicolon
            recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
            expect(recipients.length).toEqual(emails.length);

            inputField.val(emails.join(" ")); // separated by space
            recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
            expect(recipients.length).toEqual(emails.length);

            inputField.val(emails.join("\n")); // separated by newline
            recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
            expect(recipients.length).toEqual(emails.length);

            inputField.val(emails.join("\n, ")); // combined delimiters
            recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
            expect(recipients.length).toEqual(emails.length);
        });
    });

    describe('testContactsModal', function(){

        it('Should load contacts modal', function() {
            expect(widget.modal).toBeDefined();
            expect(widget.modal.container).toBeDefined();
        });

        it('Should handle empty contacts list', function() {
            widget.modal.loading();
            widget.modal.loadContacts([]);
            var modalSendBtn = widget.modal.container.find(".yes-modal-submit-btn");
            var modalTitle = widget.modal.container.find(".yes-modal-title");
            expect(modalSendBtn.css("visibility")).toEqual("hidden");
            expect(modalTitle.text()).toEqual("No contacts found!");
        });

        it('Should optionally exclude suggestions', function() {
            var personCount = 30;
            var emailsPerPerson = 3;
            var invalidEntryCount = 5;
            var contacts = generateContacts(personCount, emailsPerPerson, invalidEntryCount);
            var expectedRowCount = (personCount - invalidEntryCount) * emailsPerPerson;

            widget.modal.loading();
            widget.modal.loadContacts(contacts, true); // noSuggestions = true
            var totalRows = widget.modal.container.find(".yes-contact-row");
            var suggestedRows = widget.modal.container.find(".yes-suggested-contact-list .yes-contact-row");
            expect(totalRows.length).toEqual(expectedRowCount);
            expect(suggestedRows.length).toEqual(0);
        });

        it('Should display contacts', function() {
            // Generate dummy contact entries to load into the widget
            var personCount = 30;
            var emailsPerPerson = 3;
            var invalidEntryCount = 5;
            var contacts = generateContacts(personCount, emailsPerPerson, invalidEntryCount);
            var expectedRowCount = (personCount - invalidEntryCount) * emailsPerPerson;
            var expectedSuggestionCount = 5;

            widget.modal.loading();
            widget.modal.loadContacts(contacts);
            var totalRows = widget.modal.container.find(".yes-contact-row");
            var suggestedRows = widget.modal.container.find(".yes-suggested-contact-list .yes-contact-row");
            expect(totalRows.length).toEqual(expectedRowCount);
            expect(suggestedRows.length).toEqual(expectedSuggestionCount);
        });

        it('Should correctly handle contacts with the same name', function() {
            var emails = ["jane.doe@gmail.com", "jdoe@yahoo.net",
                          "jane.doe@about.me", "jdoe@hotmail.com"]
            var contacts = [
                {
                    name: "Jane Doe",
                    emails: emails.slice(0,2)
                },
                {
                    name: "Jane Doe",
                    emails: emails.slice(2)
                }
            ];
            widget.modal.loading();
            widget.modal.loadContacts(contacts);
            var contactRows = widget.modal.container.find(".yes-contact-row");

            // Check that the email stored in the contact row data
            // is the same as the email that is displayed
            emails.forEach(function(email) {
                var contactRow = contactRows.filter(":contains('" + email + "')");
                var storedEmail = contactRow.find("input[type='checkbox']").data("email");
                expect(storedEmail).toEqual(email);
            });
        });
    });
});

function generateContacts(personCount, emailsPerPerson, invalidEntryCount) {
    var contacts = [];
    for (var i=0; i < personCount; i++) {
        var entry = {
            name: generateRandomString(),
            emails: []
        };
        // Exclude emails from the first few entries. They should then be filtered
        // out of the results and the next suggestions should be shown instead.
        if (i >= invalidEntryCount) {
            for (var j=0; j < emailsPerPerson; j++) {
                entry.emails.push("someone@email" + Math.random() + new Date());
            }
        }
        contacts.push(entry);
    }
    return contacts;
}

function generateRandomString(len){
    // Start with an empty string & a charlist.
    var string = "";
    var chars = "ABCDEFGHIJabcdefghij1234567890ﭐﭑﭒﭓﭔﭕﭖﭗﭘﭙﭚﭛﭜﭝﭞﭟﺰﺱﺲﺳﺴﺵﺶﺷﺸﺹﺺﺻﺼﺽﺾﺿ的一是不了人我在有他这這中大来來上国國壹";
    var randint;
    len = len || 20;
    // Generate a random string of the specified length
    for (var i=0; i < len; i++) {
        randint = Math.floor(Math.random() * (chars.length - 1));
        string += chars[randint];
    }
    return string;
}
