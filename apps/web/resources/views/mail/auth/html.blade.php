<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} | Pixel Survivor</title>
</head>
<body style="margin:0;padding:0;background-color:#161421;color:#f3e9d6;font-family:Verdana,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#161421">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <!--[if mso]><table role="presentation" width="560" align="center"><tr><td><![endif]-->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#211e2f" style="max-width:560px;border:1px solid #554766;">
                    <tr>
                        <td bgcolor="#30253f" style="padding:20px 24px;border-bottom:4px solid #efc36a;color:#efc36a;font: bold 20px/1.35 'Courier New',monospace;letter-spacing:2px;">
                            PIXEL SURVIVOR
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;color:#f3e9d6;font-size:15px;line-height:1.65;">
                            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#fff4dd;">{{ $title }}</h1>
                            <p style="margin:0 0 20px;">{{ $intro }}</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td bgcolor="#efc36a" style="border:2px solid #ffe1a1;">
                                        <a href="{{ $url }}" style="display:inline-block;padding:12px 18px;color:#21172a;font-weight:bold;text-decoration:underline;">{{ $action }}</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:20px 0 8px;">{{ trans_choice('This link expires in :count minute.|This link expires in :count minutes.', $minutes) }}</p>
                            <p style="margin:0;color:#d3c7df;">{{ $ignore }}</p>
                            <p style="margin:24px 0 4px;font-size:13px;color:#d3c7df;">If the button does not open, copy this link into your browser:</p>
                            <p style="margin:0;font-size:13px;overflow-wrap:anywhere;word-break:break-all;"><a href="{{ $url }}" style="color:#efc36a;">{{ $url }}</a></p>
                        </td>
                    </tr>
                </table>
                <!--[if mso]></td></tr></table><![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>
