import chalk from "chalk";

// ── Palette ────────────────────────────────────────────
const hat   = chalk.hex("#8B5E3C");     // dark rust — hat
const hatH  = chalk.hex("#C06040");     // terracotta — hat highlight
const face  = chalk.hex("#F4A88C");     // peach — skin
const eye   = chalk.hex("#3A2A1A");     // near-black — eyes/pupils
const mouth = chalk.hex("#E8866A");     // salmon — mouth
const body  = chalk.hex("#E8866A");     // salmon — shirt

/**
 * Render the developer mascot — a pixel-art character
 * wearing a beanie / dev hat. All lines are 7 visible
 * characters wide so they centre-align perfectly.
 *
 *   ▄███▄
 *  ▐█████▌
 *   █▀ ▀█
 *   █╰─╯█
 *    ▀█▀
 */
export function renderMascot(): string[] {
  return [
    ` ${hat("▄")}${hatH("███")}${hat("▄")} `,
    `${hat("▐")}${hatH("█████")}${hat("▌")}`,
    ` ${face("█")}${eye("▀")}${face(" ")}${eye("▀")}${face("█")} `,
    ` ${face("█")}${mouth("╰─╯")}${face("█")} `,
    `  ${body("▀█▀")}  `,
  ];
}

// Wave text gradient (orange flow left → right)
const w1 = chalk.hex("#F4A88C").bold;   // peach
const w2 = chalk.hex("#E8866A").bold;   // salmon
const w3 = chalk.hex("#D4623A").bold;   // deep orange
const w4 = chalk.hex("#E8866A").bold;   // salmon
const w5 = chalk.hex("#F4A88C").bold;   // peach

/**
 * Render "Fluid Flow" as wavy flowing text — characters ride
 * a sine-wave baseline across 3 rows, colored in an orange
 * gradient to evoke motion.
 *
 *   F         d   F
 *      l    i        l    w
 *        u              o
 */
export function renderWavyName(): string[] {
  // Wave offsets per letter:
  //   F(0) l(1) u(2) i(1) d(0)  ·  F(0) l(1) o(2) w(1)
  // All rows padded to 23 visible chars for consistent centering
  const row0 =
    `${w1("F")}         ${w3("d")}   ${w5("F")}        `;
  const row1 =
    `   ${w2("l")}    ${w3("i")}        ${w2("l")}    ${w4("w")}`;
  const row2 =
    `     ${w2("u")}              ${w3("o")}  `;

  return [row0, row1, row2];
}
