import json
import redis
from functools import wraps
from datetime import datetime
import logging
from sqlalchemy.orm import class_mapper
from sqlalchemy.ext.declarative import DeclarativeMeta

from .config import settings

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Custom JSON encoder to handle various types
class SQLAlchemyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        # Handle SQLAlchemy models
        if hasattr(obj, '__class__') and hasattr(obj.__class__, '__mapper__'):
            # Convert SQLAlchemy model instance to dict
            fields = {}
            for field in [x for x in dir(obj) if not x.startswith('_') and x != 'metadata']:
                try:
                    data = obj.__getattribute__(field)
                    if isinstance(data, (str, int, float, bool, type(None))):
                        fields[field] = data
                    elif isinstance(data, datetime):
                        fields[field] = data.isoformat()
                except Exception:
                    pass
            return fields
        return super(SQLAlchemyEncoder, self).default(obj)

# Connect to Redis with explicit error handling
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL)
    # Test connection
    redis_client.ping()
    logger.info("Successfully connected to Redis")
except Exception as e:
    logger.error(f"Failed to connect to Redis: {str(e)}")
    # Create a dummy redis client for graceful degradation
    class DummyRedis:
        def get(self, *args, **kwargs): return None
        def setex(self, *args, **kwargs): pass
        def delete(self, *args, **kwargs): pass
        def scan_iter(self, *args, **kwargs): return []
    redis_client = DummyRedis()

def cache_response(prefix, expiration=settings.CACHE_EXPIRATION):
    """
    Cache decorator for API responses with improved error handling
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create a simple cache key
            cache_key = f"{prefix}:{func.__name__}"
            
            logger.debug(f"Cache wrapper called for {cache_key}")
            
            # Try to get from cache
            try:
                logger.debug(f"Attempting to get from cache with key: {cache_key}")
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    logger.info(f"Cache hit for {cache_key}")
                    try:
                        parsed_data = json.loads(cached_data)
                        return parsed_data
                    except json.JSONDecodeError as e:
                        logger.warning(f"Error parsing cached JSON: {str(e)}")
                else:
                    logger.debug(f"Cache miss for {cache_key}")
            except Exception as e:
                logger.warning(f"Error retrieving from cache: {str(e)}")
            
            # Execute function
            result = await func(*args, **kwargs)
            logger.debug(f"Function executed, got result type: {type(result)}")
            
            # Try to cache result
            try:
                logger.debug(f"Attempting to cache result with key: {cache_key}")
                # Use custom encoder for SQLAlchemy objects
                result_json = json.dumps(result, cls=SQLAlchemyEncoder)
                redis_client.setex(cache_key, expiration, result_json)
                logger.info(f"Successfully cached result for {cache_key}")
            except Exception as e:
                logger.warning(f"Error caching result: {str(e)}, type: {type(result)}")
                logger.exception(e)  # This logs the full stack trace
            
            return result
        return wrapper
    return decorator

def invalidate_cache(prefix):
    """
    Delete all cache entries with the given prefix
    """
    try:
        logger.debug(f"Attempting to invalidate cache for prefix: {prefix}")
        pattern = f"{prefix}:*"
        keys = list(redis_client.scan_iter(pattern))
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries for prefix {prefix}")
        else:
            logger.debug(f"No keys found to invalidate for pattern {pattern}")
    except Exception as e:
        logger.error(f"Error invalidating cache: {str(e)}")