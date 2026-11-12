using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class RenateLauncher
{
    [STAThread]
    private static void Main(string[] args)
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string script = Path.Combine(root, "scripts", "start-renate-desktop.ps1");
        if (!File.Exists(script))
        {
            MessageBox.Show(
                "O script de inicializacao local nao foi encontrado:\n" + script,
                "RENATE",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return;
        }

        string powershell = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.System),
            "WindowsPowerShell\\v1.0\\powershell.exe");
        string arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\"";
        foreach (string arg in args)
        {
            arguments += " \"" + arg.Replace("\"", "\\\"") + "\"";
        }

        try
        {
            string runtime = Path.Combine(root, ".cache", "renate-desktop");
            Directory.CreateDirectory(runtime);
            using (Process process = Process.Start(new ProcessStartInfo
            {
                FileName = powershell,
                Arguments = arguments,
                WorkingDirectory = root,
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            }))
            {
                string output = process.StandardOutput.ReadToEnd();
                string error = process.StandardError.ReadToEnd();
                process.WaitForExit();
                if (process.ExitCode != 0)
                {
                    string details = (error + Environment.NewLine + output).Trim();
                    if (details.Length > 2400) details = details.Substring(details.Length - 2400);
                    MessageBox.Show(
                        "O RENATE nao iniciou. Consulte os logs em:\n" + runtime +
                        (details.Length == 0 ? "" : "\n\n" + details),
                        "RENATE",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                }
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "Nao foi possivel iniciar o RENATE localmente.\n\n" + ex.Message,
                "RENATE",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }
}
