package com.rightFit.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fills the HTML mail templates in {@code classpath:mail/}. A placeholder is written {@code {{name}}}.
 * Values are HTML-escaped; raw values (markup built by {@link MailBlocks}) are inserted as they are. The fill is a
 * single pass, so a value that happens to contain a placeholder is never filled a second time.
 */
@Slf4j
@Component
public class MailTemplateRenderer {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{(\\w+)}}");

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public String render(String template, Map<String, String> values) {
        return render(template, values, Map.of());
    }

    public String render(String template, Map<String, String> values, Map<String, String> rawValues) {
        String html = cache.computeIfAbsent(template, this::load);
        Matcher m = PLACEHOLDER.matcher(html);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            String key = m.group(1);
            String replacement;
            if (rawValues.containsKey(key)) {
                replacement = rawValues.get(key);
            } else if (values.containsKey(key)) {
                replacement = values.get(key) == null ? "" : HtmlUtils.htmlEscape(values.get(key));
            } else {
                log.warn("Mail template {} has no value for {}", template, key);
                replacement = "";
            }
            m.appendReplacement(out, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(out);
        return out.toString();
    }

    private String load(String template) {
        try {
            return new ClassPathResource("mail/" + template + ".html").getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Mail template not found: " + template, e);
        }
    }
}
