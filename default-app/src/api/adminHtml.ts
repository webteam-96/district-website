/* Sanitize admin-authored rich HTML before dangerouslySetInnerHTML.
   Shared by About and DignitaryProfile (was duplicated in both).
   - <script> is stripped defensively; <style> too — a pasted Word <style>
     block is not scoped and would restyle the whole page.
   - The admin editor stores word gaps as &nbsp; (content pasted from Word /
     rotary.org). A paragraph of nbsp-joined words is one unbreakable "word":
     it can't wrap, so it overflows its column. Normalised to real spaces —
     named, numeric (&#160; / &#xa0;) and literal U+00A0 forms. */
export function sanitizeAdminHtml(html: unknown): string {
  return String(html == null ? '' : html)
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/&nbsp;|&#0*160;|&#x0*a0;|\u00a0/gi, ' ');
}
