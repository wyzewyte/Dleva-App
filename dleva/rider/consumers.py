"""
Phase 7: WebSocket Consumers for Real-Time Updates
Handles live location tracking, order status, and notifications
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from decimal import Decimal

logger = logging.getLogger(__name__)

# ============================================================================
# RIDER LOCATION CONSUMER - Live location streaming
# ============================================================================

class RiderLocationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time rider location updates
    
    Messages:
    - Rider sends: {"latitude": float, "longitude": float, "accuracy": float}
    - Backend broadcasts to buyer and admin
    """
    
    async def connect(self):
        """Accept WebSocket connection from rider"""
        self.rider_id = self.scope['url_route']['kwargs']['rider_id']
        self.user = self.scope['user']
        self.order_id = None
        
        # ✅ Initialize group_name early so it always exists (for disconnect())
        self.group_name = f'location_rider_{self.rider_id}'
        
        # ✅ ALLOW UNAUTHENTICATED CONNECTIONS (for development)
        # TODO: In production, validate rider owns this connection
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Rider {self.rider_id} connected for location tracking")
    
    async def disconnect(self, close_code):
        """Stop tracking when rider disconnects"""
        # Mark as offline
        await self._stop_tracking()
        
        # ✅ Guard: Only discard if initialized
        if hasattr(self, 'group_name'):
            try:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
            except Exception as e:
                logger.error(f"Error during disconnect: {e}")
        
        logger.info(f"Rider {self.rider_id} disconnected from location tracking")
    
    async def receive(self, text_data):
        """Receive location update from rider"""
        try:
            data = json.loads(text_data)
            
            # Validate location data
            latitude = float(data.get('latitude'))
            longitude = float(data.get('longitude'))
            accuracy = float(data.get('accuracy', 0))
            
            # Check realistic location jump (max 5km lateral movement in 30 seconds)
            # This prevents fake locations
            if not await self._is_realistic_location(latitude, longitude):
                logger.warning(f"Unrealistic location from rider {self.rider_id}")
                return
            
            # Update rider location in database
            self.order_id = await self._update_rider_location(
                latitude, longitude, accuracy
            )
            
            # Broadcast to buyer and admin
            if self.order_id:
                await self._broadcast_to_order(
                    self.order_id,
                    {
                        'type': 'location_update',
                        'rider_id': self.rider_id,
                        'latitude': latitude,
                        'longitude': longitude,
                        'accuracy': accuracy,
                        'timestamp': timezone.now().isoformat(),
                    }
                )
        
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.error(f"Error processing location data: {str(e)}")
            await self.send(json.dumps({
                'error': 'Invalid location data'
            }))
    
    async def location_update(self, event):
        """Send location update to connected clients"""
        await self.send(text_data=json.dumps(event))
    
    # ========================================================================
    # Helper Methods
    # ========================================================================
    
    @database_sync_to_async
    def _is_rider_authenticated(self):
        """Verify rider owns this connection"""
        if not self.user.is_authenticated:
            return False
        
        try:
            from rider.models import RiderProfile
            rider = RiderProfile.objects.get(user=self.user)
            return rider.id == int(self.rider_id)
        except:
            return False
    
    @database_sync_to_async
    def _update_rider_location(self, latitude, longitude, accuracy):
        """Update rider location in database"""
        from rider.models import RiderProfile, RiderLocation
        from buyer.models import Order
        
        try:
            rider = RiderProfile.objects.get(id=self.rider_id)
            
            # Check if rider has active delivery
            active_order = Order.objects.filter(
                rider=rider,
                status__in=['assigned', 'arrived', 'released', 'picked_up', 'on_the_way']
            ).first()
            
            # Update location
            location, created = RiderLocation.objects.update_or_create(
                rider=rider,
                defaults={
                    'latitude': latitude,
                    'longitude': longitude,
                    'accuracy': accuracy,
                    'current_order': active_order,
                    'is_tracking': bool(active_order),
                }
            )
            
            # Also update RiderProfile for quick access
            rider.current_latitude = latitude
            rider.current_longitude = longitude
            rider.save(update_fields=['current_latitude', 'current_longitude'])
            
            return active_order.id if active_order else None
        
        except Exception as e:
            logger.error(f"Error updating location: {str(e)}")
            return None
    
    @database_sync_to_async
    def _is_realistic_location(self, latitude, longitude):
        """Check if location jump is realistic (prevents spoofing)"""
        from rider.models import RiderLocation
        
        try:
            # Get previous location
            prev = RiderLocation.objects.filter(rider_id=self.rider_id).first()
            if not prev:
                return True  # First location is always valid
            
            # Calculate distance between points (simple approximation)
            # ~111 km per degree at equator
            lat_diff = abs(latitude - prev.latitude) * 111
            lon_diff = abs(longitude - prev.longitude) * 111
            distance_km = (lat_diff ** 2 + lon_diff ** 2) ** 0.5
            
            # Max 5km in 30 seconds = realistic speed
            max_distance = 5
            
            return distance_km <= max_distance
        
        except Exception as e:
            logger.error(f"Error validating location: {str(e)}")
            return True  # Allow on error (fail-safe)
    
    async def _broadcast_to_order(self, order_id, message):
        """Broadcast location to buyer and admin for this order"""
        try:
            # Broadcast to buyer group
            buyer_group = f'order_buyer_{order_id}'
            await self.channel_layer.group_send(
                buyer_group,
                {
                    'type': 'location_update',
                    'rider_id': message['rider_id'],
                    'latitude': message['latitude'],
                    'longitude': message['longitude'],
                    'accuracy': message['accuracy'],
                    'timestamp': message['timestamp'],
                }
            )
            
            # Broadcast to admin group
            admin_group = 'admin_dashboard'
            await self.channel_layer.group_send(
                admin_group,
                {
                    'type': 'location_update',
                    'order_id': order_id,
                    'rider_id': message['rider_id'],
                    'latitude': message['latitude'],
                    'longitude': message['longitude'],
                    'accuracy': message['accuracy'],
                    'timestamp': message['timestamp'],
                }
            )
        except Exception as e:
            logger.error(f"Error broadcasting location: {str(e)}")
    
    @database_sync_to_async
    def _stop_tracking(self):
        """Stop tracking rider when disconnected"""
        from rider.models import RiderLocation
        
        try:
            location = RiderLocation.objects.filter(rider_id=self.rider_id).first()
            if location:
                location.is_tracking = False
                location.save()
        except Exception as e:
            logger.error(f"Error stopping tracking: {str(e)}")


# ============================================================================
# ORDER STATUS CONSUMER - Live order updates
# ============================================================================

class OrderStatusConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time order status updates
    
    Clients subscribed to specific order get instant updates when:
    - Order status changes (assigned → arrived → delivered)
    - Rider location updates
    - Order events (pickup, release, etc.)
    """
    
    async def connect(self):
        """Accept connection for order updates"""
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.user = self.scope['user']
        
        # ✅ Initialize group_name early so it always exists (for disconnect())
        self.group_name = f'order_updates_{self.order_id}'
        
        # ✅ ALLOW UNAUTHENTICATED CONNECTIONS (for now)
        # TODO: In production, validate user can view this order
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Client subscribed to order {self.order_id} updates")
    
    async def disconnect(self, close_code):
        """Disconnect from order updates"""
        # ✅ Guard: Only discard group if it was added to channel layer
        if hasattr(self, 'group_name'):
            try:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"Client unsubscribed from order {self.order_id} updates")
            except Exception as e:
                logger.error(f"Error during disconnect: {e}")
    
    async def status_update(self, event):
        """Send status update to client"""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'order_id': event.get('order_id'),
            'status': event.get('status'),
            'timestamp': event.get('timestamp'),
            'message': event.get('message'),
        }))
    
    async def location_update(self, event):
        """Send location update via this order channel"""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'rider_id': event.get('rider_id'),
            'latitude': event.get('latitude'),
            'longitude': event.get('longitude'),
            'accuracy': event.get('accuracy'),
            'timestamp': event.get('timestamp'),
        }))
    
    @database_sync_to_async
    def _can_view_order(self):
        """Check if user can view this order"""
        from buyer.models import Order
        
        try:
            order = Order.objects.get(id=self.order_id)
            
            # Buyer can view their own orders
            if order.buyer and order.buyer.user_id == self.user.id:
                return True
            
            # Seller can view if it's at their restaurant
            if hasattr(self.user, 'seller_profile'):
                if order.restaurant.seller_id == self.user.seller_profile.id:
                    return True

            # Assigned rider can view the order stream
            if order.rider and order.rider.user_id == self.user.id:
                return True
            
            # Admin can view all
            if self.user.is_staff:
                return True
            
            return False
        
        except Order.DoesNotExist:
            return False


# ============================================================================
# NOTIFICATION CONSUMER - Push notification delivery
# ============================================================================

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications to riders
    
    Used for:
    - Order assignment (with sound alert)
    - Payout notifications
    - Performance warnings
    - Suspension notices
    """
    
    async def connect(self):
        """Accept notification connection"""
        self.rider_id = self.scope['url_route']['kwargs']['rider_id']
        self.user = self.scope['user']
        
        # ✅ Initialize group_name early so it always exists (for disconnect())
        self.group_name = f'notifications_rider_{self.rider_id}'
        
        # ✅ ALLOW UNAUTHENTICATED CONNECTIONS (for development)
        # TODO: In production, validate rider owns this connection
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Rider {self.rider_id} connected for notifications")
    
    async def disconnect(self, close_code):
        """Disconnect from notifications"""
        # ✅ Guard: Only discard if added to group
        if hasattr(self, 'group_name'):
            try:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"Rider {self.rider_id} disconnected from notifications")
            except Exception as e:
                logger.error(f"Error during disconnect: {e}")
    
    async def send_notification(self, event):
        """Send notification to rider"""
        await self.send(text_data=json.dumps({
            'type': event.get('notification_type'),
            'title': event.get('title'),
            'message': event.get('message'),
            'data': event.get('data', {}),
            'timestamp': event.get('timestamp'),
            'sound': event.get('sound', False),  # Play sound alert
        }))
    
    @database_sync_to_async
    def _is_rider_authenticated(self):
        """Verify rider owns this connection"""
        if not self.user.is_authenticated:
            return False
        
        try:
            from rider.models import RiderProfile
            rider = RiderProfile.objects.get(user=self.user)
            return rider.id == int(self.rider_id)
        except:
            return False


# ============================================================================
# ADMIN DASHBOARD CONSUMER - Live dashboard updates
# ============================================================================

class AdminDashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for admin live dashboard
    
    Shows:
    - Active deliveries
    - Rider locations
    - Orders waiting assignment
    - System statistics
    """
    
    async def connect(self):
        """Accept dashboard connection (admin only)"""
        self.user = self.scope['user']
        
        # ✅ Initialize group_name early so it always exists (for disconnect())
        self.group_name = 'admin_dashboard'
        
        if not self.user.is_staff:
            await self.close()
            return
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Admin {self.user.username} connected to dashboard")
    
    async def disconnect(self, close_code):
        """Disconnect admin from dashboard"""
        # ✅ Guard: Only discard if added to group
        if hasattr(self, 'group_name'):
            try:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"Admin {self.user.username} disconnected from dashboard")
            except Exception as e:
                logger.error(f"Error during disconnect: {e}")
    
    async def location_update(self, event):
        """Send rider location update to admin"""
        await self.send(text_data=json.dumps({
            'type': 'rider_location',
            'order_id': event.get('order_id'),
            'rider_id': event.get('rider_id'),
            'latitude': event.get('latitude'),
            'longitude': event.get('longitude'),
            'timestamp': event.get('timestamp'),
        }))
    
    async def status_update(self, event):
        """Send order status update to admin dashboard"""
        await self.send(text_data=json.dumps({
            'type': 'order_status',
            'order_id': event.get('order_id'),
            'status': event.get('status'),
            'timestamp': event.get('timestamp'),
        }))
    
    async def dashboard_stats(self, event):
        """Send dashboard statistics"""
        await self.send(text_data=json.dumps({
            'type': 'stats',
            'active_deliveries': event.get('active_deliveries'),
            'waiting_assignments': event.get('waiting_assignments'),
            'online_riders': event.get('online_riders'),
            'timestamp': event.get('timestamp'),
        }))


# ============================================================================
# RIDER ORDERS CONSUMER - Real-time order broadcast to all riders
# ============================================================================

class RiderOrdersConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for broadcasting new available orders to all connected riders
    
    Sends:
    - New order notifications to available riders
    - Order metadata (restaurant, distance, pickup, destination)
    - Sound alert flags for urgent orders
    """
    
    async def connect(self):
        """Accept connection from rider for new order broadcasts"""
        self.user = self.scope['user']
        
        # ✅ Initialize group_name early so it always exists (for disconnect())
        self.group_name = 'rider_orders_broadcast'
        
        # ✅ ALLOW UNAUTHENTICATED CONNECTIONS (for now)
        # TODO: In production, validate user is authenticated
        # Get rider ID from authenticated user if available
        if self.user and self.user.is_authenticated:
            try:
                from rider.models import RiderProfile
                rider = await database_sync_to_async(
                    lambda: RiderProfile.objects.get(user=self.user)
                )()
                self.rider_id = rider.id
            except:
                self.rider_id = None
        else:
            self.rider_id = None
        
        # Add to broadcast group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Rider connected to order broadcasts")

    
    async def disconnect(self, close_code):
        """Disconnect from order broadcasts"""
        # ✅ Guard: Only discard if group_name was initialized
        if hasattr(self, 'group_name'):
            try:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"Rider {self.rider_id} disconnected from order broadcasts")
            except Exception as e:
                logger.error(f"Error during disconnect: {e}")
    
    async def new_order(self, event):
        """Broadcast new order to connected riders"""
        # Only send if rider is eligible for this order
        if await self._is_order_eligible(event):
            await self.send(text_data=json.dumps({
                'type': 'new_order',
                'order_id': event.get('order_id'),
                'restaurant_id': event.get('restaurant_id'),
                'restaurant_name': event.get('restaurant_name'),
                'pickup_address': event.get('pickup_address'),
                'delivery_address': event.get('delivery_address'),
                'distance_km': float(event.get('distance_km', 0)),
                'estimated_earnings': float(event.get('estimated_earnings', 0)),
                'urgency': event.get('urgency', 'normal'),
                'items_count': event.get('items_count', 0),
                'timestamp': event.get('timestamp'),
                'sound_alert': event.get('urgency') == 'urgent',  # Play sound for urgent orders
            }))
    
    async def order_broadcast(self, event):
        """Generic broadcast message for orders"""
        if await self._is_order_eligible(event):
            await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def _is_rider_authenticated(self):
        """Verify rider owns this connection"""
        if not self.user.is_authenticated:
            return False
        
        try:
            from rider.models import RiderProfile
            rider = RiderProfile.objects.get(user=self.user)
            self.rider_id = rider.id  # Store for later use
            return True
        except:
            return False
    
    @database_sync_to_async
    def _is_order_eligible(self, event):
        """Check if rider is eligible for this order"""
        try:
            from rider.models import RiderProfile
            
            # Get rider profile
            rider = RiderProfile.objects.get(id=self.rider_id)
            
            # Rider must be:
            # 1. Online and available
            # 2. Verified (documents, bank details)
            # 3. Not suspended
            # 4. Within service area (optional: distance check)
            
            if not rider.is_online:
                return False
            
            if not rider.phone_verified or not rider.documents_approved or not rider.bank_details_added:
                return False
            
            if rider.is_suspended:
                return False
            
            # Optional: Check distance if provided
            max_distance = event.get('max_distance', 50)  # 50km default
            distance = float(event.get('distance_km', 0))
            if distance > max_distance:
                return False
            
            return True
        
        except Exception as e:
            logger.error(f"Error checking order eligibility: {e}")
            return False
