package com.rightFit.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MailTemplateRendererTest {

    private final MailTemplateRenderer renderer = new MailTemplateRenderer();

    @Test
    void loginTemplateFillsEveryPlaceholder() {
        String html = renderer.render("login-otp", Map.of(
                "firstName", "Sparsh", "otp", "483921", "expiryMinutes", "10", "requestedAt", "29 Oct 2026, 2:15 PM"));

        assertThat(html).contains("Hi Sparsh, here is your code", "483921", "Expires in 10 minutes", "29 Oct 2026, 2:15 PM");
        assertThat(html).doesNotContain("{{");
    }

    @Test
    void securityTemplateFillsEveryPlaceholder() {
        String html = renderer.render("security-otp", Map.of(
                "firstName", "Asha", "eyebrow", "Password reset", "heading", "Reset your password",
                "intro", "we received a request to reset your RightFit password.", "otp", "120045",
                "expiryMinutes", "10", "footnote", "If you didn’t request this, ignore this email."));

        assertThat(html).contains("Reset your password", "120045", "Valid for 10 minutes");
        assertThat(html).doesNotContain("{{");
    }

    @Test
    void welcomeTemplateCarriesCredentialsAndLoginLink() {
        String html = renderer.render("account-created", Map.of(
                "firstName", "Rahul", "employeeId", "EMP031", "email", "rahul@example.com",
                "temporaryPassword", "Temp#Pass1", "roleLabel", "Associate", "loginUrl", "https://example.test/login"));

        assertThat(html).contains("EMP031", "rahul@example.com", "https://example.test/login", "Associate");
        // "#" is not an HTML special character, so the password is shown as typed.
        assertThat(html).contains("Temp#Pass1");
        assertThat(html).doesNotContain("{{");
    }

    @Test
    void eventLayoutTakesMarkupBlocksAndEscapesEverythingElse() {
        String details = MailBlocks.details(java.util.List.of(new String[] {"Role", "<b>Java</b> dev"}, new String[] {"Project", null}));
        String button = MailBlocks.button("View", "https://example.test/x?a=1&b=2", "#1d4ed8");
        String html = renderer.render("event",
                Map.of("title", "T", "accent", "#1d4ed8", "eyebrow", "Selection", "heading", "You've been selected",
                        "greeting", "Hi Sparsh,", "intro", "Please confirm.", "footer", "Automatic message."),
                Map.of("rawBody", details + button));

        // The apostrophe is escaped as &#39;, which the browser shows as an apostrophe.
        assertThat(html).contains("You&#39;ve been selected", "Hi Sparsh,", "#1d4ed8");
        assertThat(html).contains("&lt;b&gt;Java&lt;/b&gt; dev");
        assertThat(html).doesNotContain("<b>Java</b>");
        // A row with no value is left out rather than printed empty.
        assertThat(html).doesNotContain(">Project<");
        assertThat(html).contains("https://example.test/x?a=1&amp;b=2");
        assertThat(html).doesNotContain("{{");
    }

    @Test
    void valuesAreEscapedSoTheyCannotChangeTheLayout() {
        String html = renderer.render("login-otp", Map.of(
                "firstName", "<script>alert(1)</script>", "otp", "000000", "expiryMinutes", "10", "requestedAt", "now"));

        assertThat(html).doesNotContain("<script>alert(1)</script>");
        assertThat(html).contains("&lt;script&gt;alert(1)&lt;/script&gt;");
    }
}
