"""Shared input validators for DRF serializers."""
import re

from rest_framework import serializers

# Matches a real HTML/XML tag: '<', optional '/', a letter or '!', then up to
# the closing '>'. Lone comparison signs like "варить < 5 мин" are NOT matched
# (a digit/space after '<' does not start a tag), so legitimate text is allowed.
_TAG_RE = re.compile(r'<\s*/?\s*[a-zA-Z!][^>]*>')


def no_html(value):
    """Reject any value containing HTML/XML tags (basic anti-XSS / clean input)."""
    if value and _TAG_RE.search(value):
        raise serializers.ValidationError(
            'HTML-теги и разметка недопустимы.'
        )
    return value
