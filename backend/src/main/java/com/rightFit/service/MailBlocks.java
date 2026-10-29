package com.rightFit.service;

import org.springframework.web.util.HtmlUtils;

import java.util.List;

/**
 * Small HTML pieces for the event emails: a details table, a note box, a one-time code and a button. Every value
 * is HTML-escaped here, so only the markup in this class reaches the message as HTML.
 */
final class MailBlocks {

    private MailBlocks() {
    }

    /** Label and value rows. Rows with a blank value are left out. */
    static String details(List<String[]> rows) {
        StringBuilder html = new StringBuilder("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;\"><tr><td style=\"padding:4px 18px;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">");
        boolean first = true;
        for (String[] row : rows) {
            if (row[1] == null || row[1].isBlank()) continue;
            html.append("<tr><td style=\"padding:11px 0;")
                    .append(first ? "" : "border-top:1px solid #e2e8f0;")
                    .append("font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#64748b;width:38%;vertical-align:top;\">")
                    .append(esc(row[0]))
                    .append("</td><td style=\"padding:11px 0;")
                    .append(first ? "" : "border-top:1px solid #e2e8f0;")
                    .append("font-size:14px;color:#0f172a;vertical-align:top;\">")
                    .append(esc(row[1]))
                    .append("</td></tr>");
            first = false;
        }
        return html.append("</table></td></tr></table>").toString();
    }

    /** A note box. tone: info, warn, danger or success. */
    static String callout(String tone, String text) {
        String[] c = switch (tone) {
            case "warn" -> new String[] {"#fff7ed", "#9a3412"};
            case "danger" -> new String[] {"#fef2f2", "#991b1b"};
            case "success" -> new String[] {"#ecfdf5", "#065f46"};
            default -> new String[] {"#eff6ff", "#1e40af"};
        };
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:16px;background:" + c[0]
                + ";border-radius:12px;\"><tr><td style=\"padding:14px 16px;font-size:13px;line-height:1.6;color:" + c[1] + ";white-space:pre-line;\">"
                + esc(text) + "</td></tr></table>";
    }

    /** A large one-time code with a short note under it. */
    static String code(String code, String note, String accent, String soft) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:" + soft + ";border:1px solid " + accent
                + ";border-radius:14px;\"><tr><td align=\"center\" style=\"padding:22px 12px;\">"
                + "<span style=\"font-family:Consolas,'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:" + accent + ";\">"
                + esc(code) + "</span><p style=\"margin:12px 0 0 0;font-size:13px;color:#475569;\">" + esc(note) + "</p></td></tr></table>";
    }

    /** A call-to-action button. Links are shown as text as well, for clients that block buttons. */
    static String button(String label, String url, String accent) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:22px;\"><tr><td align=\"center\" style=\"background:" + accent
                + ";border-radius:12px;\"><a href=\"" + esc(url) + "\" style=\"display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;\">"
                + esc(label) + "</a></td></tr></table>"
                + "<p style=\"margin:10px 0 0 0;font-size:12px;color:#64748b;word-break:break-all;\">Or open: " + esc(url) + "</p>";
    }

    static String esc(String value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value);
    }
}
