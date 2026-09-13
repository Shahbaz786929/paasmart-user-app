import { Ionicons } from "@expo/vector-icons";
import { NotificationType } from "../api/notifications";
import { colors } from "../theme/colors";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export const NOTIFICATION_META: Record<NotificationType, { icon: IconName; color: string }> = {
  ORDER_UPDATE: { icon: "receipt", color: colors.primary },
  NEW_ORDER: { icon: "bag-add", color: colors.primary },
  SHOP_STATUS: { icon: "storefront", color: colors.warning },
  RETURN_REQUEST: { icon: "return-up-back", color: colors.warning },
  CHAT_MESSAGE: { icon: "chatbubble-ellipses", color: "#3B82F6" },
  WISHLIST: { icon: "heart", color: "#EC4899" },
  WALLET: { icon: "wallet", color: colors.warning },
  PROMOTION: { icon: "pricetag", color: "#A855F7" },
  GENERAL: { icon: "notifications", color: colors.textSecondary },
};