"use client";

// One icon library for the whole app: Phosphor. Components keep the names
// they had (from lucide) so call sites don't change; each maps to the
// Phosphor icon that reads best. Arrows and carets use the bold weight so
// they stay crisp at 14–16px; larger navigation and feature icons use the
// friendlier duotone weight.
import * as P from "@phosphor-icons/react";
import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string };
export type LucideIcon = ComponentType<IconProps>;

function make(Icon: P.Icon, weight: P.IconWeight = "regular"): LucideIcon {
  const Wrapped = ({ strokeWidth: _ignored, size, className, ...rest }: IconProps) =>
    <Icon weight={weight} size={size ?? "1em"} className={className ? `ico ${className}` : "ico"} {...(rest as object)} />;
  Wrapped.displayName = `Icon(${Icon.displayName ?? "phosphor"})`;
  return Wrapped;
}
const bold = (i: P.Icon) => make(i, "bold");
const duo = (i: P.Icon) => make(i, "duotone");

// Arrows and carets
export const ArrowDown = bold(P.ArrowDown);
export const ArrowLeft = bold(P.ArrowLeft);
export const ArrowRight = bold(P.ArrowRight);
export const ArrowUp = bold(P.ArrowUp);
export const ArrowRightLeft = bold(P.ArrowsLeftRight);
export const ChevronDown = bold(P.CaretDown);
export const ChevronDownIcon = ChevronDown;
export const ChevronLeft = bold(P.CaretLeft);
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = bold(P.CaretRight);
export const ChevronRightIcon = ChevronRight;
export const ChevronUpIcon = bold(P.CaretUp);
export const ChevronsDownUp = bold(P.ArrowsInLineVertical);
export const ChevronsUpDown = bold(P.ArrowsOutLineVertical);
export const ChevronsLeftRight = bold(P.ArrowsInLineHorizontal);
export const ExternalLink = bold(P.ArrowSquareOut);
export const Maximize2 = bold(P.ArrowsOutSimple);
export const RefreshCw = bold(P.ArrowsClockwise);
export const RotateCcw = bold(P.ArrowCounterClockwise);
export const Upload = bold(P.UploadSimple);

// Actions and status
export const Check = bold(P.Check);
export const CheckIcon = Check;
export const CheckCircle2 = duo(P.CheckCircle);
export const CircleCheckIcon = CheckCircle2;
export const X = bold(P.X);
export const XIcon = X;
export const XCircle = duo(P.XCircle);
export const OctagonXIcon = duo(P.XCircle);
export const Plus = bold(P.Plus);
export const Pencil = make(P.PencilSimple);
export const Trash2 = make(P.Trash);
export const Ban = make(P.Prohibit);
export const Link2 = bold(P.LinkSimple);
export const Paperclip = make(P.Paperclip);
export const Play = make(P.Play, "fill");
export const Pause = make(P.Pause, "fill");
export const Eye = make(P.Eye);
export const EyeOff = make(P.EyeSlash);
export const MoreHorizontal = bold(P.DotsThree);
export const GripVertical = bold(P.DotsSixVertical);
export const Search = bold(P.MagnifyingGlass);
export const SearchIcon = Search;
export const SearchX = duo(P.MagnifyingGlassMinus);
export const SlidersHorizontal = make(P.SlidersHorizontal);
export const Loader2 = bold(P.CircleNotch);
export const Loader2Icon = Loader2;
export const AlertTriangle = duo(P.Warning);
export const TriangleAlertIcon = AlertTriangle;
export const InfoIcon = duo(P.Info);
export const ShieldAlert = duo(P.ShieldWarning);
export const Flag = duo(P.Flag);
export const LogOut = make(P.SignOut);
export const UserRound = duo(P.User);
export const UserRoundPlus = make(P.UserPlus);
export const KeyRound = duo(P.Key);
export const Keyboard = duo(P.Keyboard);
export const Sun = duo(P.Sun);
export const Moon = duo(P.Moon);
export const Monitor = duo(P.Monitor);
export const Palette = duo(P.Palette);
export const Wrench = duo(P.Wrench);
export const Tag = duo(P.Tag);
export const Tags = duo(P.TagSimple);
export const Clock = duo(P.Clock);
export const Timer = duo(P.Timer);
export const Calendar = make(P.CalendarBlank);
export const CalendarDays = duo(P.CalendarDots);
export const CalendarX2 = duo(P.CalendarX);
export const MessageSquare = make(P.ChatCircle);
export const GitBranch = make(P.GitBranch);
export const FileText = duo(P.FileText);
export const PanelLeftClose = duo(P.SidebarSimple);
export const PanelLeftOpen = duo(P.SidebarSimple);
export const PanelRightOpen = duo(P.ArrowSquareIn);
export const MousePointerClick = duo(P.CursorClick);
export const PartyPopper = duo(P.Confetti);
export const Compass = duo(P.Compass);
export const Lightbulb = duo(P.Lightbulb);
export const Sparkles = duo(P.Sparkle);
export const Zap = duo(P.Lightning);
export const HelpCircle = duo(P.Question);
export const CircleHelp = HelpCircle;

// Navigation and ticket types
export const ListTodo = duo(P.ListChecks);
export const Inbox = duo(P.Tray);
export const KanbanSquare = duo(P.Kanban);
export const Rows3 = duo(P.Rows);
export const Map = duo(P.MapTrifold);
export const Network = duo(P.TreeStructure);
export const ChartNoAxesColumn = duo(P.ChartBar);
export const LayoutGrid = duo(P.SquaresFour);
export const Settings = duo(P.GearSix);
export const Layers = duo(P.Stack);
export const Bug = duo(P.Bug);
export const Siren = duo(P.Siren);
export const Headset = duo(P.Headset);
export const FlaskConical = duo(P.Flask);
export const SquareCheckBig = duo(P.CheckSquare);
export const Workflow = duo(P.FlowArrow);
export const House = duo(P.House);
export const Users = duo(P.UsersThree);
export const Repeat = bold(P.ArrowsClockwise);
export const Target = duo(P.Target);
